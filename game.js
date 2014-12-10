var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
});
var dbOperations = require('./dbOperations');
var serverLogger = require('./serverLogger');
var bidController = require('./bid');

var apiKey = "tZUXOOZ8Lf7spqPCBkcSjaRqJzeXyvTk";

// default server channel logger
var logger = new serverLogger();

// For client - get games you can subscribe to
exports.getGames = function (req, res) {
    dbOperations.GameModel.where('status').in(['Active', 'Waiting']).exec(function (err, docs) {
        if (!err && docs.length > 0) {
            return res.status(200).send(docs);
        }
        else {
            if (docs.length === 0) {
                logger.info("No games found");
                res.status(404).send("No games found");
            } else {
                logger.error(err);
                res.status(500).send(err);
            }
        }
    });
};

//// Get single game info
//exports.getGame = function (req, res) {
//    logger.info('getting game info for game ', req.res.id);
//    dbOperations.getEntity(req.params.id, dbOperations.caches.gameCache, function (game) {
//        if (game) {
//            return game;
//        } else {
//            res.status(404).end();
//        }
//    });
//};

// For event managers - get waiting events
exports.getWaitingGames = function (req, res) {
    dbOperations.GameModel.find({status: "Waiting", assignedTo: req.params.id}, function (err, docs) {
        if (!err && docs.length > 0) {
            return res.status(200).send(docs);
        }
        else {
            if (docs.length === 0) {
                logger.info("No games found");
                res.status(404).send("No games found");
            } else {
                logger.error(err);
                res.status(500).send(err);
            }
        }
    });
};

// ## Create game entity in DB and start game
exports.createGame = function (req, res) {
    var newGame;
    if (req.body._id) {
        logger.info("Updating game: ", req.body.gameName);
        dbOperations.GameModel.findOne({_id: req.body._id}, function (err, game) {
            if(!err){
                game.gameName = req.body.gameName;
                game.teams = req.body.teams;
                game.timestamp = new Date(req.body.timestamp);
                game.assignedTo = req.body.assignedTo;
                game.location = req.body.location;
                game.type = req.body.type;
                game.status = "Waiting";
                game.save(function (err, game) {
                    if(!err){
                        logger.info("Updated game ", game.gameName);
                        res.status(200).send(game);
                    } else {
                        logger.error(err.toString());
                        res.status(500).send(err.toString());
                    }
                });
            } else {
                logger.error(err.toString());
            }
        });
    } else {
        logger.info("Creating game: ", req.body.gameName);
        newGame = new dbOperations.GameModel({
            gameName: req.body.gameName,
            teams: req.body.teams,
            timestamp: new Date(req.body.timestamp),
            location: req.body.location,
            type: req.body.type,
            status: "Waiting"
        });

        newGame.save(function (err, game) {
            if (!err) {
                logger.info("Game created with id " + game.id);
                res.status(200).send(game);
            }
            else {
                logger.error(err);
                res.status(500).send(err);
            }
        });
    }
};


// Initialize previously created game
exports.initGame = function (req, res) {
    var minDate = new Date(new Date().setMinutes(new Date().getMinutes() - 15));
    var maxDate = new Date(new Date().setMinutes(new Date().getMinutes() + 15));
    dbOperations.GameModel.
        //where('timestamp').lte(maxDate).gte(minDate)
        where('_id', req.params.id)
        //.where('assignedTo', req.body.userId)
        .limit(1)
        .exec(function (err, games) {
            if (!err && games.length > 0) {
                var game = games[0];
                game.status = "Active";
                game.save(function (err, game) {
                    if (!err) {
                        logger.gameLogger.setLogger(game._id);
                        logger.gameLogger.log(game._id, "Activated game: ", game.gameName);
                        res.status(200).send(game);
                    } else {
                        res.status(500).send(err);
                    }
                });
            }
        });
};


// Assign specified game to specified manager
exports.assignGame = function (req, res) {
    dbOperations.GameModel.findOne({_id: req.body.gameId}, function (err, game) {
        if (!err) {
            if (game) {
                // Check for games assigned to user +/- 10 hours before and after the newly assigned game
                var gameDate = new Date(game.timestamp);
                dbOperations.GameModel
                    .where('timestamp').lte(new Date(gameDate.setHours(gameDate.getHours() + 10))).gte(new Date(gameDate.setHours(gameDate.getHours() - 10)))
                    .where('assignedTo', req.body.managerId)
                    .limit(1)
                    .exec(function (err, docs) {
                        if (docs.length > 0) {
                            res.status(500).send("Manager has a game assigned during this time");
                        } else {
                            game.assignedTo = req.body.managerId;
                            game.save(function (err, savedGame) {
                                if (!err) {
                                    logger.info("assigned game: ", savedGame.gameName, " to manager ", savedGame.assignedTo);
                                    res.status(200).end();
                                } else {
                                    res.status(500).send(err);
                                }
                            });
                        }
                    });
            } else {
                res.status(404).end();
            }
        } else {
            logger.error(err.toString());
        }
    });
};

exports.closeGame = function (req, res) {
    logger.info("Closing game:", req.params.id);
    dbOperations.GameModel.findOne({_id: req.params.id}, function (err, game) {
        if(!err) {
            if (game) {
                game.status = "Inactive";
                game.save(function (err, game) {
                    if(!err){
                        logger.gameLogger.removeLogger(game._id);
                        logger.info("closed game", game.gameName, "successfully");
                        pubnub.publish({
                            channel: game._id,
                            message: {gameId: game._id, close: true}
                        });
                        res.status(200).end();
                    } else {
                        res.status(500).send(err);
                    }
                });
            } else {
                res.status(404).end();
            }
        } else {
            logger.error(err.toString());
        }
    });
};