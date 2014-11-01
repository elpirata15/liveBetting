var pubnub = require("pubnub").init({
    publish_key: "pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151",
    subscribe_key: "sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe"
});
var dbOperations = require('./dbOperations');
var serverLogger = require('./serverLogger');
var bidController = require('./bid');

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
            if (docs.length == 0) {
                logger.info("No games found");
                return res.status(404).send("No games found");
            } else {
                logger.error(err);
                return res.status(500).send(err);
            }
        }
    });
};

// Get single game info
exports.getGame = function(req, res){
  logger.info('getting game info for game ', req.res.id);
    dbOperations.getEntity(req.params.id, null, function(game){
     if(game){
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
            if (docs.length == 0) {
                logger.info("No games found");
                return res.status(404).send("No games found");
            } else {
                logger.error(err);
                return res.status(500).send(err);
            }
        }
    });
};

// ## Create game entity in DB and start game
exports.createGame = function (req, res) {
    var newGame;
    if(req.body._id){
        logger.info("Updating game: ", req.body.gameName);
        dbOperations.getEntity(req.body._id, null, function(game){
            game.gameName = req.body.gameName;
            game.teams = req.body.teams;
            game.timestamp = new Date(req.body.timestamp);
            game.assignedTo = req.body.assignedTo;
            game.location = req.body.location;
            game.type = req.body.type;
            game.status = "Waiting";
            dbOperations.updateDb(game, function(game){
                logger.info("Updated game ", game.gameName);
                res.status(200).send(game);
            }, function(err){
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
    var minDate = new Date(new Date().getTime() - 15 * 60000);
    var maxDate = new Date(new Date().getTime() + 15 * 60000);
    dbOperations.GameModel.findOne({
        _id: req.params.id,
        timestamp: {$gte: minDate, $lte: maxDate},
        assignedTo: req.body.userId
    }, function (err, game) {
        if (!err && game) {
            game.status = "Active";
            dbOperations.updateDb(game, function (game) {

                // Subscribe to game message socket
                pubnub.subscribe({
                    channel: game._id,
                    message: bidController.receiveBid,
                    error: function (data) {
                        logger.error(game.gameName + ": " + data);
                    },
                    connect: function (data) {
                        logger.info(game.gameName + ": " + data);
                    },
                    disconnect: function (data) {
                        logger.error(game.gameName + ": " + data);
                    }
                });
                serverLogger.gameLogger.setLogger(game._id);
                serverLogger.gameLogger.log(game._id, "Activated game: ", game.gameName);
                return res.status(200).send(game);
            });
        }else {
            res.status(500).send(err);
        }
    });
};

// Assign specified game to specified manager
exports.assignGame = function (req, res) {
    dbOperations.getEntity(req.body.gameId, null, function (game) {
        if (game) {
            game.assignedTo = req.body.managerId;
            dbOperations.updateDb(game, function (game) {
                logger.info("assigned game: ", game.gameName, " to manager ", game.assignedTo);
                return res.status(200).end();
            }, function (err) {
                return res.status(500).send(err);
            })
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
                serverLogger.gameLogger.removeLogger(game._id);
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