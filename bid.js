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

// Adds bid entity to game (receives bid entity as parameter)
exports.addBid = function (message) {
    dbOperations.getEntity(message.gameId, null, function (doc) {
        if (doc) {
            logger.info("new bid opened in game " + doc.gameName + ": " + message.bidDescription);
            doc.bids.push({
                gameId: message.gameId,
                gameName: doc.gameName,
                bidDescription: message.bidDescription,
                bidType: message.bidType,
                bidOptions: message.bidOptions,
                timestamp: Date.now(),
                status: "Active",
                ttl: message.ttl
            });
            dbOperations.updateDb(doc, function (doc) {
                serverLogger.gameLogger.log(doc._id, "Saved");

                // Close bid after set ttl in case bid wasn't closed
                setTimeout(function(){
                    bidChanged({gameId: message.gameId, bidId:doc.bids[doc.bids.length - 1]._id, close:true});
                }, message.ttl * 1000);

                // Subscribe to bid message socket
                pubnub.subscribe({
                    channel: doc.bids[doc.bids.length - 1]._id,
                    message: function (message) {
                        if (message.uuid && message.uuid.indexOf("console") > -1) {
                            bidChanged(message);
                        } else {
                            receiveBid(message);
                        }
                    },
                    error: function (data) {
                        serverLogger.gameLogger.log(doc._id, "bid " + channel + ": " + data);
                    },
                    connect: function (data) {
                        serverLogger.gameLogger.log(doc._id, "bid " + channel + ": " + data);
                    },
                    disconnect: function (data) {
                        serverLogger.gameLogger.log(doc._id, "bid " + channel + ": " + data);
                    }
                });

                serverLogger.gameLogger.log(doc._id, "bid added successfully");
            }, function (err) {
                serverLogger.gameLogger.log(doc._id, err);
            });
        } else {
            serverLogger.gameLogger.log(doc._id, "ERROR!!! game not found");
        }
    });
};

var checkBid = function (bidInfo, item, callback) {
    if (item.bidOption == bidInfo.winningBid) {
        item.status = "Win";
        item.winAmount = item.betAmount * bidInfo.odds;
    } else {
        item.status = "Lose";
        item.winAmount = -1 * item.betAmount;
    }
    updateUserBalanceInDb(item, callback);
};

var updateUserBalanceInDb = function (item, callback) {
    dbOperations.UserModel.findOne({_id: item.userId}, function (err, doc) {
        if (!err) {
            doc.balance += item.winAmount;
            doc.save(function (err, doc) {
                if (!err) {
                    serverLogger.gameLogger.log(doc._id, "updated user: ", user, " balance ", item.winAmount);
                    callback();
                } else {
                    serverLogger.gameLogger.log(doc._id, err);
                    callback(err);
                }
            });
        } else {
            serverLogger.gameLogger.log(doc._id, err);
            callback(err);
        }
    });
};

// ## callback when manager notifies bid has changed - if he closes the bid, close = true. If he pressed a result (close the bid with the winning option)
var bidChanged = exports.bidChanged = function (message) {
    dbOperations.getEntity(message.gameId, null, function (doc) {
        if (doc) {
            var currentBid = doc.bids.id(message.bidId);
            if (message.close) {
                currentBid.status = "Inactive";
            } else {
                currentBid.status = "Inactive";
                currentBid.winningOption = req.body.winningOption;
                var winningOdds = currentBid.bidOptions[currentBid.winningOption].optionsOdds;
                async.each(currentBid.bidRequests, checkBid.bind(null, {
                        winningBid: currentBid.winningOption,
                        odds: winningOdds
                    }),
                    function (err) {
                        if (err) {
                            serverLogger.gameLogger.log(doc._id, err);
                        } else {
                            serverLogger.gameLogger.log(doc._id, "Updated bid requests in bid");
                        }
                    });
            }
            // Update bid requests to db
            dbOperations.updateDb(doc, function () {
                serverLogger.gameLogger.log(doc._id, "Successfully updated game entity");
            });
        } else {
            serverLogger.gameLogger.log(doc._id, "could not find game ", message.gameId);
        }
    });
};

// ## receive bid request object from user through game message socket and add to db
var receiveBid = exports.receiveBid = function (message) {
    serverLogger.gameLogger.log(message.gameId, "received bid request for game: " + channel);
    dbOperations.getEntity(message.gameId, function (doc) {
        if (doc) {
            if (doc.bids.id(message.bidId).status == "Active") {
                doc.bids.bidRequests.push({
                    userId: message.userId,
                    bidId: message.bidId,
                    gameId: message.gameId,
                    bidOption: message.bidOption,
                    status: null,
                    betAmount: message.betAmount,
                    winAmount: 0
                });
                dbOperations.updateDb(doc, function () {
                    serverLogger.gameLogger.log(doc._id, "bid request added successfully");
                    publishMessage(message.userId, {success: true});
                }, function (err) {
                    serverLogger.gameLogger.log(doc._id, "bid request addition failed: ", err);
                    publishMessage(message.userId, {error: err});
                });
            } else {
                serverLogger.gameLogger.log(doc._id, "request made for inactive bid, request rejected");
                // send unauthorized code to client
                publishMessage(message.userId, {inactive: true});
            }
        } else {
            publishMessage(message.gameId, {gameNotFound: true});
        }
    });
};

