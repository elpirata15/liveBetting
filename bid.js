var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
});
var async = require('async');
var dbOperations = require('./dbOperations');
var serverLogger = require("./serverLogger");

// default server channel logger
var logger = new serverLogger();

var publishMessage = function (channel, message) {
    pubnub.publish({
        channel: channel,
        message: message
    });
};

// new Id generator
exports.newId = function (req, res) {
    res.send(dbOperations.ObjectId());
};

// Active bids cache
var activeBids = {};

// Adds bid entity to game (receives bidEntity as parameter)
exports.addBid = function (bidMessage) {
    // Get the bidEntity from the message (the message from the client contains pn_gcm for android push notifications)
    var bid = bidMessage.bidEntity;
    var bidOptionsArray = [];
    // Initialize participants for options
    for (var i in bid.bidOptions) {
        bidOptionsArray.push(bid.bidOptions[i]);
        bidOptionsArray[i].participants = [];
    }
    bid.bidOptions = bidOptionsArray;
    bid.status = "Active";
    bid.totalPoolAmount = 0;

    // Add bid to active bids cache
    activeBids[bid.id] = {entity: bid};

    logger.gameLogger.log(bid.gameId, "bid added successfully");

    activeBids[bid.id].timer = setInterval(function(){
        // If bid is active
        if(bid.status == "Active") {
            // Make server message feedback
            var serverMessage = {totalPoolAmount: bid.totalPoolAmount, options: []};

            // Loop through all the options
            for (var i in bid.bidOptions) {

                // Add total participants for option
                serverMessage.options.push({id: i, participants: bid.bidOptions[i].participants.length});
            }
            // Send the message on bid_id_msg channel
            publishMessage(bid.id + "_msg", serverMessage);
        }
    }, 1000);

    // Subscribe to bid_id channel
    pubnub.subscribe({
        channel: bid.id,
        callback: function (message, env, channel) {
            // If this is a close message
            if (message.close) {
                // Close bid
                closeBid(message, channel);
                // If this a winning option message
            } else if (message.hasOwnProperty("winningOption")) {
                winningOptionMessage(message, channel);
                // This is a bid request from user
            } else {
                addParticipant(message, channel);
            }
        },
        connect: function () {
            logger.info("Connected to bid channel: ", bid.id);
        },
        disconnect: function () {
            logger.error("Disconnected from bid channel: ", bid.id);
        }
    });

};

// Adds participant to bid option
var addParticipant = function (bidRequest, bidId) {

    // Get the current bid
    var currentBid = activeBids[bidId].entity;

    // If we got a bid
    if (currentBid) {

        ensureUserBalance(bidRequest, currentBid.gameId, function () {
            logger.info("received bid request for game: " + bidId);

            currentBid.totalPoolAmount = parseInt(currentBid.totalPoolAmount, 10) + parseInt(bidRequest.amount, 10);

            // If the bid is active
            if (currentBid.status == "Active") {

                // Add participant to desired option
                currentBid.bidOptions[bidRequest.option].participants.push({
                    userId: bidRequest.userId,
                    amount: bidRequest.amount
                });
                logger.gameLogger.log(currentBid.gameId, "bid request added successfully");

                logger.gameLogger.log(currentBid.gameId, "Sending OK to user "+bidRequest.userId);
                // Send OK to user
                publishMessage(bidRequest.userId, {info: "OK"});



                logger.gameLogger.log(currentBid.gameId, "total pool amount: "+currentBid.totalPoolAmount);

                // If the bid is inactive
            } else {
                logger.gameLogger.error(currentBid.gameId, "Rejected Bid Request: Bid is Inactive");

                logger.gameLogger.log(currentBid.gameId, "Sending error to user "+bidRequest.userId);

                // Publish to user that the bid is rejected
                publishMessage(bidRequest.userId, {error: "Rejected Bid Request: Bid is Inactive"});
            }
        });
    }
};

// Closes bid after manager sends close message
var closeBid = function (closeMessage, bidId) {

    // Get the bid object
    var currentBid = activeBids[bidId].entity;

    // If you found the bid
    if (currentBid) {

        // Change bid status to inactive
        currentBid.status = "Inactive";

        // Alert the manager
        logger.gameLogger.log(currentBid.gameId, "Bid " + bidId + " is now Inactive");

        clearInterval(activeBids[bidId].timer);
    }
};

var winningOptionMessage = function (winningOptionObject, bidId) {

    // Get the bid object
    var currentBid = activeBids[bidId].entity;

    // If you found the bid
    if (currentBid) {

        // Change bid status to inactive
        currentBid.winningOption = winningOptionObject.winningOption;

        // Alert the manager
        logger.gameLogger.log(currentBid.gameId, "Winning option " + currentBid.winningOption + " set for bid " + bidId + ". Now adding all to DB");

        sendToDbAndUpdateUsers(currentBid);
    }
};

var sendToDbAndUpdateUsers = function (bid) {

    // Alert the manager
    logger.gameLogger.log(bid.gameId, "Saving bid " + bid.id + " to DB and updating users balances");

    // Get the game entity
    dbOperations.getEntity(bid.gameId, null, function (game) {

        // If we found the game
        if (game) {

            // Add bid to game bids
            game.bids.push(bid);

            //bid._id = bid.id = dbOperations.getObjectIdFromString(bid.id);

            // Save the game
            dbOperations.updateDb(game, function () {

                // Alert manager
                logger.gameLogger.log(bid.gameId, "Saved bid. Removing from active bids");

                // Update users balances
                updateUserBalances(bid);
            }, function (err) {
                logger.error(err);
            });
        } else {

            // Alert manager
            logger.gameLogger.error(bid.gameId, "could not find game ", bid.gameId);
        }
    });
};

var updateUserBalances = function (bid) {

    var winningMoney = 0;

    // Get winning option participants
    var winningUsers = bid.bidOptions[bid.winningOption].participants.length;

    // If there were winning users
    if (winningUsers > 0) {

        // Calculate winning money  (take 20% off - this is how we make money :D). If there is only one user (entry amount equals the total pool) give user back his money (no winnings)
        winningMoney = (bid.totalPoolAmount != bid.entryAmount) ? bid.totalPoolAmount * 0.8 / winningUsers : 0;
    }
    // Loop through the options
    for (var i in bid.bidOptions) {

        // If this is the winning option
        if (i == bid.winningOption) {

            // Perform task in parallel for each winning participant
            async.each(bid.bidOptions[i].participants, function (participant, callback) {

                // Find user entity
                dbOperations.UserModel.findOne({_id: participant.userId}, function (err, user) {

                    // If no error and we found the user
                    if (!err && user) {

                        // Add the winning money to balance
                        user.balance += winningMoney;

                        // Save user
                        user.save(function (err, savedUser) {

                            // If there is no error
                            if (!err) {

                                // Log success
                                logger.info("Added " + winningMoney + " to user " + savedUser._id + " balance");

                                // Send OK to user
                                publishMessage(savedUser._id, {newBalance: savedUser.balance});

                                // Return with no error
                                callback();
                            } else {

                                // Return with error
                                callback(err);
                            }
                        });
                    } else {

                        // Return with error
                        callback(err);
                    }
                });
            }, function (err) {

                // If we have an error
                if (err) {

                    // Log error and add bid object to log for further use (manual fixing of user's balances)
                    logger.error(err);
                    logger.error(activeBids[bid.id].entity);
                } else {

                    // Log success
                    logger.info("Updated users balances");
                }
            });

            // This is not a winning option
        } else {

            // Perform task in parallel for each winning participant
            async.each(bid.bidOptions[i].participants, function (participant, callback) {

                // Find user entity
                dbOperations.UserModel.findOne({_id: participant.userId}, function (err, user) {

                    // If no error and we found the user
                    if (!err && user) {

                        // Add the winning money to balance
                        user.balance -= participant.amount;

                        // Save user
                        user.save(function (err, savedUser) {

                            // If there is no error
                            if (!err) {

                                // Log success
                                logger.info("Subtracted " + participant.amount + " to user " + savedUser._id + " balance");

                                // Send OK to user
                                publishMessage(savedUser._id, {newBalance: savedUser.balance});

                                // Return with no error
                                callback();
                            } else {

                                // Return with error
                                callback(err);
                            }
                        });
                    } else {

                        // Return with error
                        callback(err);
                    }
                });
            }, function (err) {

                // If we have an error
                if (err) {

                    // Log error and add bid object to log for further use (manual fixing of user's balances)
                    logger.error(err);
                    logger.error(activeBids[bid.id].entity);
                } else {

                    // Log success
                    logger.info("Updated users balances");
                }
            });
        }
    }

    // Remove bid from active bids cache
    delete activeBids[bid.id];
};

// Ensures a users balance to make a bet
var ensureUserBalance = function (bidRequest, gameId, callback) {

    // Find the user
    dbOperations.UserModel.findOne({_id: bidRequest.userId}, function (err, user) {

        // If we don't have an error
        if (!err) {
            // If we found a user and the balance is sufficient
            if (user && user.balance >= bidRequest.amount) {

                // Alert manager
                logger.gameLogger.log(gameId, "User " + user._id + " has sufficient funds to make this bet");

                callback();

                // If no sufficient funds
            } else {

                // Alert manager
                logger.gameLogger.error(gameId, "User " + user._id + " doesn't have sufficient funds to make this bet");
                return false;
            }
        } else {

            // Log error
            logger.error(err);
        }
    });
};