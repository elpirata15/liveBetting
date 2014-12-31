var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
});
var async = require('async');
var dbOperations = require('./dbOperations');
var serverLogger = require("./serverLogger");

// default server channel logger
var logger = new serverLogger();

var activeTimers = {};

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
    dbOperations.cacheEntity(dbOperations.caches.bidCache, {entity: bid});

    activeTimers[bid.id] = setInterval(function () {
        // If bid is active
        if (bid.status == "Active") {
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

    logger.info(bid.gameId, ["bid added successfully"]);
};
exports.addBidRequest = function (message, env, channel) {
    // If this is a close message
    if (message.close) {
        // Close bid
        closeBid(message, message.bidId);
        // If this a winning option message
    } else if (message.hasOwnProperty("winningOption")) {
        winningOptionMessage(message, message.bidId);
        // This is a bid request from user
    } else {
        addParticipant(message, message.bidId);
    }
};

// Adds participant to bid option
var addParticipant = function (bidRequest, bidId) {

    dbOperations.getBidEntity(bidId, function (bidEntity) {

        var currentBid = bidEntity.entity;

        // If we got a bid
        if (currentBid) {

            ensureUserBalance(bidRequest, currentBid.gameId, function () {
                logger.info(null, ["received bid request for game: ", bidId]);

                currentBid.totalPoolAmount = parseInt(currentBid.totalPoolAmount, 10) + parseInt(bidRequest.amount, 10);

                // If the bid is active
                if (currentBid.status == "Active") {

                    // Add participant to desired option
                    currentBid.bidOptions[bidRequest.option].participants.push({
                        userId: bidRequest.userId,
                        amount: bidRequest.amount
                    });
                    logger.info(currentBid.gameId, ["bid request added successfully"]);

                    logger.info(currentBid.gameId, ["Sending OK to user " + bidRequest.userId]);
                    // Send OK to user
                    publishMessage(bidRequest.userId, {info: "OK"});

                    dbOperations.cacheEntity(dbOperations.caches.bidCache, bidEntity);

                    logger.info(currentBid.gameId, ["total pool amount: " + currentBid.totalPoolAmount]);

                    // If the bid is inactive
                } else {
                    logger.error(currentBid.gameId, ["Rejected Bid Request: Bid is Inactive"]);

                    logger.info(currentBid.gameId, ["Sending error to user " + bidRequest.userId]);

                    // Publish to user that the bid is rejected
                    publishMessage(bidRequest.userId, {error: "Rejected Bid Request: Bid is Inactive"});
                }
            });
        }
    });
};

// Closes bid after manager sends close message
var closeBid = function (closeMessage, bidId) {

    dbOperations.getBidEntity(bidId, function (bidEntity) {

        var currentBid = bidEntity.entity;

        // If you found the bid
        if (currentBid) {

            // Change bid status to inactive
            currentBid.status = "Inactive";

            dbOperations.cacheEntity(dbOperations.caches.bidCache, bidEntity);

            // Alert the manager
            logger.info(currentBid.gameId, ["Bid " + bidId + " is now Inactive"]);

            clearInterval(activeTimers[bidId]);
        }
    });
};

var winningOptionMessage = function (winningOptionObject, bidId) {

    dbOperations.getBidEntity(bidId, function (bidEntity) {

        var currentBid = bidEntity.entity;

        // If you found the bid
        if (currentBid) {

            // Change bid status to inactive
            currentBid.winningOption = winningOptionObject.winningOption;

            dbOperations.cacheEntity(dbOperations.caches.bidCache, bidEntity);

            // Alert the manager
            logger.info(currentBid.gameId, ["Winning option " + currentBid.winningOption + " set for bid " + bidId + ". Now adding all to DB"]);

            sendToDbAndUpdateUsers(currentBid);
        }
    });
};

var sendToDbAndUpdateUsers = function (bid) {

    // Alert the manager
    logger.info(bid.gameId, ["Saving bid " + bid.id + " to DB and updating users balances"]);

    // Get the game entity
    dbOperations.GameModel.findOne({_id: bid.gameId}, function (err, game) {
        if (!err) {
            // If we found the game
            if (game) {

                // Add bid to game bids
                game.bids.push(bid);

                //bid._id = bid.id = dbOperations.getObjectIdFromString(bid.id);

                // Save the game
                game.save(function (err, savedGame) {
                    if (!err) {
                        // Alert manager
                        logger.info(bid.gameId, ["Saved bid. Removing from active bids"]);

                        // Update users balances
                        updateUserBalances(bid);
                    } else {
                        logger.error(null,[err]);
                    }
                });
            } else {

                // Alert manager
                logger.error(bid.gameId, ["could not find game ", bid.gameId]);
            }
        } else {
            logger.error(null,[err.toString()]);
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
        winningMoney = (bid.totalPoolAmount != bid.entryAmount) ? bid.totalPoolAmount / winningUsers : 0;
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
                                logger.info(null,["Added " + winningMoney + " to user " + savedUser._id + " balance"]);

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
                    logger.error(null,[err]);
                    logger.error(null,[bid.toString()]);
                } else {

                    // Log success
                    logger.info(null,["Updated users balances"]);
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
                                logger.info(null,["Subtracted " + participant.amount + " to user " + savedUser._id + " balance"]);

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
                    logger.error(null,[err]);
                    logger.error(null,[bid.toString()]);
                } else {

                    // Log success
                    logger.info(null,["Updated users balances"]);
                }
            });
        }
    }

    // Remove bid from active bids cache
    dbOperations.uncacheEntity(dbOperations.caches.bidCache, bid.id);
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
                logger.info(gameId, ["User " + user._id + " has sufficient funds to make this bet"]);

                callback();

                // If no sufficient funds
            } else {

                // Alert manager
                logger.error(gameId, ["User " + user._id + " doesn't have sufficient funds to make this bet"]);
                return false;
            }
        } else {

            // Log error
            logger.error(null,[err]);
        }
    });
};