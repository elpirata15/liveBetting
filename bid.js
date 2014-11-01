var pubnub = require("pubnub").init({
    publish_key: "pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151",
    subscribe_key: "sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe"
});
var async = require('async');
var dbOperations = require('./dbOperations');
var serverLogger = require("./serverLogger");

// default server channel logger
var logger = new serverLogger();

// Adds bid entity to game (receives bid entity as parameter)
exports.addBid = function (req, res) {
    logger.info("new bid opened in game " + req.body.gameName + ": " + req.body.bidDescription);
    dbOperations.getEntity(req.body.gameId, null, function(doc){
        if (doc) {
            doc.bids.push({
                gameId: req.body.gameId,
                gameName: doc.gameName,
                bidDescription: req.body.bidDescription,
                bidType: req.body.bidType,
                bidOptions: req.body.bidOptions,
                timestamp: Date.now(),
                status: "Active",
                ttl: req.body.ttl
            });
            dbOperations.updateDb(doc, function (doc) {
                serverLogger.gameLogger.log(doc._id,"Bid opened successfully");
                // publish bid to users
                pubnub.publish({
                    channel: req.body.gameId,
                    message: doc,
                    callback: function () {
                        serverLogger.gameLogger.log(doc._id,"Published bid for game", doc.gameName);
                    },
                    error: function (e) {
                        serverLogger.gameLogger.log(doc._id,"FAILED! RETRY PUBLISH!", e);
                    }
                });

                // Subscribe to bid message socket
                pubnub.subscribe({
                    channel: doc.bids[doc.bids.length - 1]._id,
                    message: bidChanged,
                    error: function (data) {
                        serverLogger.gameLogger.log(doc._id,"bid " +channel+": " + data);
                    },
                    connect: function (data) {
                        serverLogger.gameLogger.log(doc._id,"bid " +channel+ ": " + data);
                    },
                    disconnect: function (data) {
                        serverLogger.gameLogger.log(doc._id,"bid " +channel+ ": " + data);
                    }
                });

                res.status(200).send(doc.bids[doc.bids.length - 1]);
            }, function(err){
                res.status(500).send(err);
            });
        } else {
            res.status(404).end();
        }
    });
};

var checkBid = function(bidInfo, item, callback){
    if(item.bidOption == bidInfo.winningBid){
        item.status = "Win";
        item.winAmount = item.betAmount * bidInfo.odds;
    } else {
        item.status = "Lose";
        item.winAmount = -1 * item.betAmount;
    }
    updateUserBalanceInDb(item, callback);
};

var updateUserBalanceInDb = function(item, callback){
    dbOperations.UserModel.findOne({_id:item.userId}, function(err,doc){
        if(!err){
            doc.balance += item.winAmount;
            doc.save(function(err, doc){
                if(!err){
                    serverLogger.gameLogger.log(doc._id,"updated user: ", user, " balance ",item.winAmount);
                    callback();
                } else {
                    serverLogger.gameLogger.log(doc._id ,err);
                    callback(err);
                }
            });
        } else {
            serverLogger.gameLogger.log(doc._id ,err);
            callback(err);
        }
    });
};

// ## callback when manager notifies bid has changed - if he closes the bid, close = true. If he pressed a result (close the bid with the winning option)
exports.bidChanged = function (message) {
    dbOperations.getEntity(message.gameId, null, function(doc){
        if (doc) {
            var currentBid = doc.bids.id(message.bidId);
            if (message.close) {
                currentBid.status = "Inactive";
            } else {
                if(!req.body.winningOption){
                    return;
                }
                currentBid.status = "Inactive";
                currentBid.winningOption = req.body.winningOption;
                var winningOdds = currentBid.bidOptions[currentBid.winningOption].optionsOdds;
                async.each(currentBid.bidRequests, checkBid.bind(null, {winningBid: currentBid.winningOption, odds: winningOdds}),
                    function(err) {
                        if(err){
                            serverLogger.gameLogger.log(doc._id ,err);
                        } else {
                            serverLogger.gameLogger.log(doc._id ,"Updated bid requests in bid");
                        }
                    });
                // Update bid requests to db
                return dbOperations.updateDb(doc, function () {
                    serverLogger.gameLogger.log(doc._id ,"Successfully updated game entity");
                });
            }
        } else {
            return serverLogger.gameLogger.log(doc._id ,"could not find game ", message.gameId);
        }
    });
};

// ## receive bid request object from user through game message socket and add to db
exports.receiveBid = function (message, envelope, channel) {
    serverLogger.gameLogger.log(doc._id ,"received bid request for game: " + channel);
    dbOperations.getEntity(message.gameId, function(doc){
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
                    serverLogger.gameLogger.log(doc._id ,"bid request added successfully");
                    return res.status(200).end();
                }, function(err){
                    return res.status(500).send(err);
                });
            } else {
                serverLogger.gameLogger.log(doc._id ,"request made for inactive bid, request rejected");
                // send unauthorized code to client
                return res.status(403).send("Bid is inactive");
            }
        } else {
            return res.status(404);
        }
    });
};
