var pubnub = require("pubnub").init({
    publish_key: "pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151",
    subscribe_key: "sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe"
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
    res.send(new dbOperations.ObjectId());
};

// Active bids cache
var activeBids = {};

// Adds bid entity to game (receives bidEntity as parameter)
exports.addBid = function (bidMessage) {
    // Get the bidEntity from the message (the message from the client contains pn_gcm for android push notifications)
    var bid = bidMessage.bidEntity;
    // Initialize participants for options
    for(var i in bid.bidOptions){
        bid.bidOptions[i].participants = [];
    }

    // Add auto loser option
    bid.bidOptions.push = {
        optionDescription: "Automatic Losers",
        automaticLoser: true,
        participants: []
    };

    // Add bid to active bids cache
    activeBids[bid.id] = bid;

    serverLogger.gameLogger.log(bid.gameId, "bid added successfully");

    // Subscribe to bid_id channel
    pubnub.subscribe({
        channel: bid.id,
        callback: function (message, env, channel) {
            // If this is a close message
            if (message.close) {
                // Close bid
                closeBid(message, channel);
                // If this a winning option message
            } else if (message.winningOption) {
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
    var currentBid = activeBids[bidId];

    // If we got a bid
    if (currentBid && ensureUserBalance(bidRequest, currentBid.gameId)) {
        serverLogger.gameLogger.log(currentBid.gameId, "received bid request for game: " + bidId);

        currentBid.totalPoolAmount += bidRequest.amount;

        // If the bid is active
        if (currentBid.status == "Active") {

            // Add participant to desired option
            currentBid.bidOptions[bidRequest.option].push({
                userId: bidRequest.userId,
                amount: bidRequest.amount
            });
            serverLogger.gameLogger.log(currentBid.gameId, "bid request added successfully");

            // Send OK to user
            publishMessage(bidRequest.userId, {info: "OK"});

            // Make server message feedback
            var serverMessage = {totalPoolAmount: currentBid.totalPoolAmount, options: []};

            // Loop through all the options
            for (var i in currentBid.bidOptions) {

                // If this is the last option (auto losers), stop the loop
                if (i == currentBid.bidOptions.length - 1) {
                    break;
                }

                // Add total participants for option
                serverMessage.bidOptions.push(currentBid.bidOptions[i].length);
            }

            // Send the message on bid_id_msg channel
            publishMessage(bidId + "_msg", serverMessage);

        // If the bid is inactive
        } else {

            // If the option was -1 (auto losers)
            if (bidRequest.option == -1) {

                // Add request to auto losers
                currentBid.bidOptions[currentBid.bidOptions.length - 1].push({
                    userId: bidRequest.userId,
                    amount: bidRequest.amount
                });
                serverLogger.gameLogger.log(currentBid.gameId, "Automatic loser bid request added successfully");

                // If this is not auto losers option
            } else {
                serverLogger.gameLogger.log(currentBid.gameId, "Rejected Bid Request: Bid is Inactive");

                // Publish to user that the bid is rejected
                publishMessage(bidRequest.userId, {error: "Rejected Bid Request: Bid is Inactive"});
            }
        }
    }
};

// Closes bid after manager sends close message
var closeBid = function (closeMessage, bidId) {

    // Get the bid object
    var currentBid = activeBids[bidId];

    // If you found the bid
    if (currentBid) {

        // Change bid status to inactive
        currentBid.status = "Inactive";

        // Alert the manager
        serverLogger.gameLogger.log(currentBid.gameId, "Bid " + bidId + " is now Inactive");
    }
};

var winningOptionMessage = function (winningOptionObject, bidId) {

    // Get the bid object
    var currentBid = activeBids[bidId];

    // If you found the bid
    if (currentBid) {

        // Change bid status to inactive
        currentBid.winningOption = winningOptionObject.winningOption;

        // Alert the manager
        serverLogger.gameLogger.log(currentBid.gameId, "Winning option " + currentBid.winningOption + " set for bid " + bidId + ". Now adding all to DB");

        sendToDbAndUpdateUsers(currentBid);
    }
};

var sendToDbAndUpdateUsers = function (bid) {

    // Alert the manager
    serverLogger.gameLogger.log(bid.gameId, "Saving bid " + bid.id + " to DB and updating users balances");

    // Get the game entity
    dbOperations.getEntity(bid.gameId, null, function (game) {

        // If we found the game
        if (game) {

            // Add bid to game bids
            game.bids.push(bid);

            // Save the game
            dbOperations.updateDb(game, function (savedGame) {

                // Alert manager
                serverLogger.gameLogger.log(bid.gameId, "Saved bid. Removing from active bids");

                // Update users balances
                updateUserBalances(savedGame.bids.id(bid.id));
            }, function (err) {
                logger.error(err);
            });
        } else {

            // Alert manager
            serverLogger.gameLogger.log(bid.gameId, "could not find game ", bid.gameId);
        }
    });
};

var updateUserBalances = function (bid) {

    var winningMoney = 0;

    // Get winning option participants (add house as winning participant - this is how we make money :D)
    var winningUsers = bid.bidOptions[bid.winningOption].participants.length + 1;

    // If there were winning users
    if (winningUsers > 0) {

        // Calculate winning money
        winningMoney = bid.totalPoolAmount / winningUsers;
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
                if(err){

                    // Log error and add bid object to log for further use (manual fixing of user's balances)
                    logger.error(err);
                    logger.error(activeBids[bid.id]);
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
                if(err){

                    // Log error and add bid object to log for further use (manual fixing of user's balances)
                    logger.error(err);
                    logger.error(activeBids[bid.id]);
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
var ensureUserBalance = function (bidRequest, gameId) {

    // Find the user
    dbOperations.UserModel.findOne({_id: bidRequest.userId}, function (err, user) {

        // If we don't have an error
        if (!err) {

            // If we found a user and the balance is sufficient
            if (user && user.balance >= bidRequest.amount) {

                // Alert manager
                serverLogger.gameLogger.log(gameId, "User " + user.fullName + "has sufficient funds to make this bet");

                return true;

                // If no sufficient funds
            } else {

                // Alert manager
                serverLogger.gameLogger.log(gameId, "User " + user.fullName + "doesn't have sufficient funds to make this bet");
                return false;
            }
        } else {

            // Log error
            logger.error(err);
        }
    });
};