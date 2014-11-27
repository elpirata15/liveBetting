var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
});
var dbOperations = require('./dbOperations');
var serverLogger = require('./serverLogger');
var bidController = require('./bid');
var request = require("request");

var apiKey = "tZUXOOZ8Lf7spqPCBkcSjaRqJzeXyvTk";

// default server channel logger
var logger = new serverLogger();

// Find active games on server load - in case server fails
dbOperations.GameModel.find({status: 'Active'}, function (err, docs) {
    for (var ind in docs) {
        //noinspection JSUnfilteredForInLoop
        dbOperations.cacheEntity("activeGames", docs[ind]);
    }
    logger.info('currently active games: ' + docs.length);
});

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

// Get single game info
exports.getGame = function (req, res) {
    logger.info('getting game info for game ', req.res.id);
    dbOperations.getEntity(req.params.id, null, function (game) {
        if (game) {
            return game;
        } else {
            res.status(404).end();
        }
    });
};

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
        dbOperations.getEntity(req.body._id, null, function (game) {
            game.gameName = req.body.gameName;
            game.teams = req.body.teams;
            game.timestamp = new Date(req.body.timestamp);
            game.assignedTo = req.body.assignedTo;
            game.location = req.body.location;
            game.type = req.body.type;
            game.status = "Waiting";
            dbOperations.updateDb(game, function (game) {
                logger.info("Updated game ", game.gameName);
                res.status(200).send(game);
            }, function (err) {
                logger.error(err);
                res.status(500).send(err);
            });
        });
    } else {
        logger.info("Creating game: ", req.body.gameName);
        newGame = new dbOperations.GameModel({
            gameName: req.body.gameName,
            teams: req.body.teams,
            timestamp: new Date(req.body.timestamp),
            assignedTo: req.body.assignedTo,
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
            dbOperations.updateDb(game, function (game) {
                // Subscribe to game message socket
                pubnub.subscribe({
                    channel: game._id,
                    message: bidController.addBid,
                    error: function (data) {
                        logger.error(data);
                    },
                    connect: function (data) {
                        logger.info(data);
                    },
                    disconnect: function (data) {
                        logger.error(data);
                    }
                });
                logger.gameLogger.setLogger(game._id);
                logger.gameLogger.log(game._id, "Activated game: ", game.gameName);
                res.status(200).send(game);
            });
        } else {
            res.status(500).send(err);
        }
    });
};



// Assign specified game to specified manager
exports.assignGame = function (req, res) {
    dbOperations.getEntity(req.body.gameId, null, function (game) {
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
                        dbOperations.updateDb(game, function (game) {
                            logger.info("assigned game: ", game.gameName, " to manager ", game.assignedTo);
                            res.status(200).end();
                        }, function (err) {
                            res.status(500).send(err);
                        });
                    }
                });
        } else {
            res.status(404).end();
        }
    });
};

exports.closeGame = function (req, res) {
    logger.info("Closing game:", req.params.id);
    dbOperations.getEntity(req.params.id, null, function (doc) {
        if (doc) {
            doc.status = "Inactive";
            dbOperations.updateDb(doc, function (game) {
                dbOperations.uncacheEntity("activeGames", req.params.id);
                logger.gameLogger.removeLogger(game._id);
                logger.info("closed game", game.gameName, "successfully");
                res.status(200).end();
            }, function (err) {
                res.status(500).send(err);
            });
        } else {
            res.status(404).end();
        }
    });
};