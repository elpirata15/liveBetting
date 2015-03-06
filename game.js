var pubnub = require("./pubnubManager");
var dbOperations = require("./dbOperations");
var serverLogger = require('./serverLogger');

// default server channel logger
var logger = new serverLogger();
var gameStatus = {inactive: 0, waiting: 1, firstHalf: 2, halfTime: 3, secondHalf: 4, beforeExtraTime: 5,
    extra1: 6, extraHalfTime: 7, extra2:8,penalty:9};

exports.gameStatus = function(req, res){
    res.status(200).send(gameStatus);
};

// For client - get games you can subscribe to
exports.getGames = function (req, res) {
    logger.info(null, ["Getting all games"]);
    dbOperations.GameModel.find({status: {$ne: gameStatus.inactive}}).sort({timestamp: 'asc'}).exec(function (err, docs) {
        if (!err && docs.length > 0) {
            return res.status(200).send(docs);
        }
        else {
            if (docs.length === 0) {
                logger.info(null, ["No games found"]);
                res.status(404).send("No games found");
            }
            else {
                logger.error(null, [err]);
                res.status(500).send(err);
            }
        }
    });
};

// Get single game info
exports.getGame = function (req, res) {
    logger.info(null, ['getting game info for game ', req.params.id]);
    dbOperations.GameModel.findOne({_id: req.params.id}, function (err, game) {
        if (err) {
            logger.error(null, ['Error getting game info for game ', err.toString()]);
            res.status(500).send(err);
        }
        if (game) {
            res.status(200).send(game);
        } else {
            res.status(404).end();
        }
    });
};

exports.findGameByDateLeague = function (req, res) {
    var league = req.body.gameLeague || "";
    logger.info(null, ['getting', league, 'games from dates', req.body.startDate, "-", req.body.endDate]);
    var query = dbOperations.GameModel.find({});
    if (league !== '') {
        query = dbOperations.GameModel.find({'gameLeague': league});
    }
    query.where('timestamp').lte(req.body.endDate).gte(req.body.startDate)
        .exec(function (err, games) {
            if (err) {
                logger.error(null, ['Error getting games ', err.toString()]);
                res.status(500).send(err);
            }
            logger.info(null, ['Found', games.length, 'games']);
            res.status(200).send(games);
        });

};

exports.getLiveGameList = function (req, res) {
    dbOperations.GameModel.find({status: {$ne: gameStatus.inactive}}, 'gameName gameLeague', function (err, docs) {
        if (err) {
            logger.error(null, ['Error getting active game list: ', err.toString()]);
            res.status(500).send(err);
        }

        res.status(200).send(docs);
    });
};

// For event managers - get waiting events
exports.getWaitingGames = function (req, res) {
    dbOperations.GameModel.find({
        status: gameStatus.waiting,
        assignedTo: req.params.id
    }, function (err, docs) {
        if (!err && docs.length > 0) {
            return res.status(200).send(docs);
        }
        else {
            if (docs.length === 0) {
                logger.info(null, ["No games found"]);
                res.status(200).send("No games found");
            }
            else {
                logger.error(null, [err]);
                res.status(500).send(err);
            }
        }
    });
};

exports.getGameBids = function (req, res) {
    logger.info(null, ["Getting bids for game", req.params.gameId]);
    dbOperations.GameModel.findOne({
        _id: req.params.gameId
    }, function (err, game) {
        if (err) {
            logger.error(null, ["Failed to get game bids:", err.toString()]);
            res.status(500).send(err);
        }
        if (!game) {
            logger.error(null, ["Failed to get game bids: no game by this Id"]);
            res.status(500).send("no game by this Id");
        }

        res.status(200).send(game.bids);

    });
};

// ## Create game entity in DB and start game
exports.createGame = function (req, res) {
    var newGame;
    if (req.body._id) {
        logger.info(null, ["Updating game:", req.body.gameName]);
        dbOperations.GameModel.findOne({
            _id: req.body._id
        }, function (err, game) {
            if (!err) {
                game.gameName = req.body.gameName;
                game.teams = req.body.teams;
                game.timestamp = new Date(req.body.timestamp);
                game.gameLeague = req.body.gameLeague;
                game.assignedTo = req.body.assignedTo;
                game.location = req.body.location;
                game.status = gameStatus.waiting;
                game.save(function (err, game) {
                    if (!err) {
                        logger.info(null, ["Updated game", game.gameName]);
                        res.status(200).send(game);
                    }
                    else {
                        logger.error(null, [err.toString()]);
                        res.status(500).send(err.toString());
                    }
                });
            }
            else {
                logger.error(null, [err.toString()]);
            }
        });
    }
    else {
        logger.info(null, ["Creating game:", req.body.gameName]);
        newGame = new dbOperations.GameModel({
            gameName: req.body.gameName,
            gameLeague: req.body.gameLeague,
            teams: req.body.teams,
            timestamp: new Date(req.body.timestamp),
            location: req.body.location,
            status: gameStatus.waiting
        });

        newGame.save(function (err, game) {
            if (!err) {
                logger.info(null, ["Game created with id", game.id]);
                res.status(200).send(game);
            }
            else {
                logger.error(null, [err]);
                res.status(500).send(err);
            }
        });
    }
};

exports.gameScore = function (req, res) {
    dbOperations.GameModel.findOne({_id: req.body.id}, function (err, game) {
        if (err) {
            logger.error(req.body.id, ["Failed to update game score:", err.toString()]);
            res.status(500).send(err);
        }

        game.gameScore = req.body.gameScore;
        game.save(function (err, savedGame) {
            if (err) {
                logger.error(req.body.id, ["Failed to update game score:", err.toString()]);
                res.status(500).send(err);
            }
            logger.info(req.body.id, ["Updated game score:", savedGame.gameScore]);
            // Publish new score on gameId channel
            pubnub.publishMessage(req.body.id, {score: savedGame.gameScore});
            res.status(200).end();
        });
    });
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

                game.tvDelay = parseInt(req.body.preGameParams.tvDelay);
                game.gameScore = "0:0";
                game.save(function (err, game) {
                    if (!err) {
                        var team1 = {
                            id: game.teams[0],
                            lineup: req.body.preGameParams.team1.lineup,
                            bench: req.body.preGameParams.team1.bench,
                            teamName: req.body.preGameParams.team1.teamName
                        };
                        var team2 = {
                            id: game.teams[1],
                            lineup: req.body.preGameParams.team2.lineup,
                            bench: req.body.preGameParams.team2.bench,
                            teamName: req.body.preGameParams.team2.teamName
                        };
                        game.teams[0] = team1;
                        game.teams[1] = team2;
                        logger.info(game._id, ["Activated game:", game.gameName, "with", game.tvDelay, "seconds of TV delay"]);
                        res.status(200).send(game);
                    }
                    else {
                        res.status(500).send(err);
                    }
                });
            }
        });
};

exports.setStatus = function(req, res){
    dbOperations.GameModel.findOne({_id: req.params.id}, function(err, game){
        if (err) {
            logger.error(null, ["Could not pause game", err.toString()]);
            res.status(500).send(err);
        }
        if(!game){
            logger.error(null, ["Could not pause game: game not found"]);
            res.status(500).send("Could not pause game: game not found");
        }
        game.status = req.body.status;
        game.statusTimestamp = req.body.timestamp;
        if(req.body.status === gameStatus.firstHalf){
            game.timestamp = req.body.timestamp;
        }
        game.save(function(err, savedGame){
            if(err){
                logger.error(null, ["Could not save game", err.toString()]);
                res.status(500).send(err);
            }
            pubnub.sendGcm({
                gameId: savedGame._id,
                status: savedGame.status,
                gameName: savedGame.gameName,
                timestamp: savedGame.statusTimestamp
            });
            res.status(200).end();
        });
    });
};

exports.getGameTeams = function (req, res) {
    dbOperations.GameModel.findOne({
        _id: req.params.id
    }, function (err, game) {
        if (err) {
            logger.error(null, ["Failed to get game:", err.toString()]);
            res.status(500).send(err);
        }
        if (!game) {
            logger.error(null, ["No Game Found"]);
            res.status(500).send("No Game Found");
        }

        res.status(200).send(game.teams);
    });
};

// Assign specified game to specified manager
exports.assignGame = function (req, res) {
    dbOperations.GameModel.findOne({
        _id: req.body.gameId
    }, function (err, game) {
        if (!err) {
            if (game) {
                // Check for games assigned to user +/- 10 hours before and after the newly assigned game
                var gameDate = new Date(game.timestamp);
                dbOperations.GameModel
                    .where('timestamp').lte(new Date(gameDate.setHours(gameDate.getHours() + 10))).gte(new Date(gameDate.setHours(gameDate.getHours() - 10)))
                    .where('assignedTo', req.body.managerId)
                    .limit(1)
                    .exec(function (err, docs) {
                        if(err){
                            logger.error(null, [err.toString()]);
                            res.status(500).send(err);
                        }
                        if (docs.length > 0) {
                            res.status(500).send("Manager has a game assigned during this time");
                        }
                        else {
                            game.assignedTo = req.body.managerId;
                            game.save(function (err, savedGame) {
                                if (!err) {
                                    logger.info(null, ["assigned game:", savedGame.gameName, "to manager", savedGame.assignedTo]);
                                    res.status(200).end();
                                }
                                else {
                                    logger.error(null, ["couldn't assign game:", err.toString()]);
                                    res.status(500).send(err);
                                }
                            });
                        }
                    });
            }
            else {
                res.status(404).end();
            }
        }
        else {
            logger.error(null, [err.toString()]);
        }
    });
};

exports.closeGame = function (req, res) {
    logger.info(null, ["Closing game:", req.params.id]);
    dbOperations.GameModel.findOne({
        _id: req.params.id
    }, function (err, game) {
        if (!err) {
            if (game) {
                game.status = gameStatus.inactive;
                game.save(function (err, game) {
                    if (!err) {
                        logger.info(null, ["closed game", game.gameName, "successfully"]);
                        pubnub.sendGcm({
                            data: {
                                gameId: game._id,
                                close: true
                                }
                        });
                        pubnub.publishMessage(game._id, {
                            pn_apns: {
                                    gameId: game._id,
                                    close: true
                                },
                            //lb_gcm: {
                            //    data: {
                            //        gameId: game._id,
                            //        close: true
                            //    }
                            //},
                            gameMessage: {
                                gameId: game._id,
                                close: true
                            }
                        });
                        pubnub.publishMessage('allGames', {
                            gameId: game._id,
                            gameName: game.gameName,
                            close: true
                        });
                        res.status(200).end();
                    }
                    else {
                        res.status(500).send(err);
                    }
                });
            }
            else {
                res.status(404).end();
            }
        }
        else {
            logger.error(null, [err.toString()]);
        }
    });
};