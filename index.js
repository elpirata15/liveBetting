var express = require('express');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var pubnub = require("pubnub").init({
    publish_key: "pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151",
    subscribe_key: "sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe"
});
var bodyParser = require('body-parser');
var async = require("async");

var serverLogger = require("./serverLogger");

var logger = new serverLogger();
var app = express();

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

var ObjectId = Schema.ObjectId;
var optionEntity = new Schema({
    optionDescription: String,
    optionOdds: Number
});

var bidRequestEntity = new Schema({
    userId: ObjectId,
    bidId: ObjectId,
    gameId: ObjectId,
    bidOption: Number,
    status: String,
    winAmount: Number,
    betAmount: Number
});

var bidEntity = new Schema({
    gameId: ObjectId,
    gameName: String,
    bidDescription: String,
    bidType: String,
    bidOptions: [optionEntity],
    winningOption: Number,
    timestamp: Date,
    status: String,
    bidRequests: [bidRequestEntity],
    ttl: Number
});

var gameEntity = new Schema({
    gameName: String,
    teams: [String],
    assignedTo: String,
    location: String,
    timestamp: Date,
    type: String,
    status: String,
    bids: [bidEntity]
});

var gameModel = mongoose.model('games', gameEntity);

var userEntity = new Schema({
    email: String,
    pass: String,
    fullName: String,
    balance: Number
});

var userModel = mongoose.model('users', userEntity);

mongoose.connect("mongodb://root:elirankon86@ds047050.mongolab.com:47050/heroku_app30774540");

// #################################################################################################

// Game loggers
var gameLoggers = {}

// Active games cache
var cache = {
    activeGames: {}

};

// ** DB FUNCTION WITH CACHING **
var updateDb = function (entity, callback, errCallback) {
    return entity.save(function (err, savedEntity) {
        if (!err) {
            callback(savedEntity);
        } else {
            logger.error(err);
            return errCallback(err);
        }
    });
};

var getEntity = function (entityId, cacheType, callback) {
    var cacheString = cacheType ? cacheType : "activeGames";
    if (cache[cacheString].hasOwnProperty(entityId)) {
        return cache[cacheString][entityId];
    }
    gameModel.findOne({_id: entityId}, function (err, doc) {
        if (!err || !doc || doc != undefined) {
            cacheEntity(cacheType ? cacheType : "activeGames", doc);
            callback(doc);
        }
        else {
            callback(false);
        }
    });

};

var cacheEntity = function (cacheType, entity) {
    return cache[cacheType][entity._id] = entity;
};

// #### GAME LOGGER HELPER OBJECT #####
var setLogger = function(gameId){
    gameLoggers[gameId] = new serverLogger.ServerLogger(gameId);
};

var removeLogger = function(gameId){
    delete gameLoggers.gameId;
};

// Find active games on server load - in case server fails
gameModel.find({status: 'Active'}, function (err, doc) {
    for (var ind in doc) {
        cacheEntity("activeGames", doc[ind]);
    }
    logger.info('currently active games: ' + doc.length);
});

// ##### GAME ACTIONS #####

// For client - get games you can subscribe to
app.get('/getGames', function (req, res) {
    gameModel.where('status').in(['Active', 'Waiting']).exec(function (err, docs) {
        if (!err && docs.length > 0) {
            return res.status(200).send(docs);
        }
        else {
            if (docs.length == 0) {
                logger.info("No games found");
                return res.status(404).send("No games found");
            } else {
                logger.error(err);
                return res.status(500).send(err);
            }
        }
    });
});

// For event managers - get waiting events
app.get('/getWaitingGames/:id', function (req, res) {
    gameModel.find({status: "Waiting", assignedTo: req.params.id}, function (err, docs) {
        if (!err && docs.length > 0) {
            return res.status(200).send(docs);
        }
        else {
            if (docs.length == 0) {
                logger.info("No games found");
                return res.status(404).send("No games found");
            } else {
                logger.error(err);
                return res.status(500).send(err);
            }
        }
    });
});

// ## Create game entity in DB and start game

app.post('/createGame', function (request, response) {
    logger.info("Creating game: " + request.body.gameName);
    var newGame = new gameModel({
        gameName: request.body.gameName,
        teams: request.body.teams,
        timestamp: new Date(request.body.timestamp),
        assignedTo: request.body.assignedTo,
        location: request.body.location,
        type: request.body.type,
        status: "Waiting"
    });

    newGame.save(function (err, game) {
        if (!err) {
            logger.info("Game created with id " + game.id);
            return response.status(200).send(game);
        }
        else {
            logger.error(err);
            return response.status(500).send(err);
        }
    });
});

// Initialize previously created game
app.post('/initGame/:id', function (req, res) {
    getEntity(req.params.id, null, function(game){
        if (game) {
            game.status = "Active";
            updateDb(game, function (game) {

                // Add to active games cache
                cacheEntity("activeGames", game);

                // Subscribe to game message socket
                pubnub.subscribe({
                    channel: game._id,
                    message: receiveBid,
                    error: function (data) {
                        logger.error(game.gameName + ": " + data);
                    },
                    connect: function (data) {
                        logger.info(game.gameName + ": " + data);
                    },
                    disconnect: function (data) {
                        logger.warn(game.gameName + ": " + data);
                    }
                });
                setLogger(game._id);
                gameLoggers[game._id].info("Activated game: ", game.gameName);
                return res.status(200).end();

            }, function(err){
                return res.status(500).send(err);
            });
        } else {
            res.status(404).end();
        }
    });

});

// Assign specified game to specified manager
app.get('/assignGame/:gameId/:managerId', function(req, res){
    getEntity(req.params.gameId, null, function(game){
        if(game){
            game.assignedTo = req.params.managerId;
            updateDb(game, function(game){
                logger.info("assigned game: ", game.gameName, " to manager ", game.assignedTo);
                return res.status(200).end();
            }, function(err){
                return res.status(500).send(err);
            })
        } else {
            res.status(404).end();
        }
    });
});

app.post('/closeGame/:id', function (req, res) {
    logger.info("Closing game:", req.params.id);
    getEntity(req.params.id, null, function(doc){
        if (doc) {
            doc.status = "Inactive";
            updateDb(doc, function (game) {
                delete cache.activeGames[req.params.id];
                removeLogger(game._id);
                logger.info("closed game", game.gameName, "successfully");
                res.status(200).end();
            }, function(err){
                res.status(500).send(err);
            });
        } else {
            res.status(404).end();
        }
    });
});

// #### BID FUNCTIONS #####

// Adds bid entity to game (receives bid entity as parameter)
app.post('/addBid', function (req, res) {
    logger.info("new bid opened in game " + req.body.gameName + ": " + req.body.bidDescription);
    getEntity(req.body.gameId, null, function(doc){
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
            updateDb(doc, function (doc) {
                gameLoggers[doc._id].info("Bid opened successfully");
                // publish bid to users
                pubnub.publish({
                    channel: req.body.gameId,
                    message: doc,
                    callback: function () {
                        gameLoggers[doc._id].info("Published bid for game", doc.gameName);
                    },
                    error: function (e) {
                        gameLoggers[doc._id].error("FAILED! RETRY PUBLISH!", e);
                    }
                });

                // Subscribe to bid message socket
                pubnub.subscribe({
                    channel: doc.bids[doc.bids.length - 1]._id,
                    message: bidChanged,
                    error: function (data) {
                        gameLoggers[doc._id].error("bid " +channel+": " + data);
                    },
                    connect: function (data) {
                        gameLoggers[doc._id].info("bid " +channel+ ": " + data);
                    },
                    disconnect: function (data) {
                        gameLoggers[doc._id].info("bid " +channel+ ": " + data);
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
});
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
    userModel.findOne({_id:item.userId}, function(err,doc){
        if(!err){
            doc.balance += item.winAmount;
            doc.save(function(err, doc){
                if(!err){
                    gameLoggers[doc._id].info("updated user: ", user, " balance ",amount);
                    callback();
                } else {
                    gameLoggers[doc._id].error(err);
                    callback(err);
                }
            });
        } else {
            gameLoggers[doc._id].error(err);
            callback(err);
        }
    });
};

// ## callback when manager notifies bid has changed - if he closes the bid, close = true. If he pressed a result (close the bid with the winning option)
var bidChanged = function (message) {
    getEntity(message.gameId, null, function(doc){
        var msg = "";
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
                            gameLoggers[doc._id].error(err);
                        } else {
                            gameLoggers[doc._id].info("Updated bid requests in bid");
                        }
                    });
                // Update bid requests to db
                return updateDb(doc, function () {
                    gameLoggers[doc._id].info("Successfully updated game entity");
                });
            }
        } else {
            publishErrorMsg(message.bidId);
            return gameLoggers[doc._id].error("could not find game ", message.gameId);
        }
    });
};

var publishErrorMsg = function(bidId){
    pubnub.publish({
        channel: bidId,
        message: "ERROR",
        callback: function () {
            gameLoggers[doc._id].info("Replied Error to bid ",message.bidId);
        },
        error: function (e) {
            gameLoggers[doc._id].error("FAILED! RETRY PUBLISH!", e);
        }
    });

};

// ## receive bid request object from user through game message socket and add to db
var receiveBid = function (message, envelope, channel) {
    gameLoggers[doc._id].info("received bid request for game: " + channel);
    getEntity(message.gameId, function(doc){
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
                updateDb(doc, function () {
                    gameLoggers[doc._id].info("bid request added successfully");
                    return res.status(200).end();
                }, function(err){
                    return res.status(500).send(err);
                });
            } else {
                gameLoggers[doc._id].error("request made for inactive bid, request rejected");
                // send unauthorized code to client
                return res.status(403).send("Bid is inactive");
            }
        } else {
            return res.status(404);
        }
    });
};

app.listen(app.get('port'), function () {
    logger.info("Node app is running at localhost:" + app.get('port'));
});
