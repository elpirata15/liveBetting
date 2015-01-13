var dbOperations = require('./dbOperations');
var serverLogger = require('./serverLogger');

// default channel logger
var logger = new serverLogger();

exports.newTeam = function(req, res) {
    if (req.body._id) {
        dbOperations.TeamModel.findOne({
            _id: req.body._id
        }, function(err, team) {
            if (!err) {
                if (team) {
                    logger.info(null, ["Updating team:", req.body.teamName]);
                    team.teamName = req.body.teamName;
                    team.teamLeagues = req.body.teamLeagues;
                    team.teamCountry = req.body.teamCountry;
                    team.players = [];
                    for (var i in req.body.players) {
                        team.players.push(req.body.players[i]);
                    }


                    team.save(function(err, savedTeam) {
                        if (!err) {
                            logger.info(null, ["Updated team", savedTeam._id]);
                            res.status(200).send(savedTeam);
                        }
                        else {
                            logger.error(null, [err.toString()]);
                            res.status(500).send(err);
                        }
                    });
                }
                else {
                    logger.error(null, ["No team found with ID", req.body._id]);
                    res.status(500).send("No team found with ID " + req.body._id);
                }

            }
            else {
                logger.error(null, [err.toString()]);
                res.status(500).send(err);
            }
        });
    }
    else {
        logger.info(null, ["Creating a new team:", req.body.teamName]);
        var newTeam = new dbOperations.TeamModel({
            teamName: req.body.teamName,
            teamLeagues: req.body.teamLeagues,
            teamCountry: req.body.teamCountry,
            players: []
        });

        for (var i in req.body.players) {
            newTeam.players.push(req.body.players[i]);
        }

        newTeam.save(function(err, savedTeam) {
            if (!err) {
                logger.info(null, ["Team created successfully"]);
                res.status(200).send(savedTeam);
            }
            else {
                logger.error(null, [err.toString()]);
                res.status(500).send(err);
            }
        });
    }
};

exports.getTeam = function(req, res) {
    dbOperations.TeamModel.findOne({
        _id: req.params.id
    }, function(err, team) {
        if (err) {
            logger.error(null, ["Failed to get team: ", err.toString()]);
            res.status(500).send(err);
        }

        res.status(200).send(team);
    });
};

exports.getTeams = function(req, res) {
    dbOperations.TeamModel.find({}, function(err, team) {
        if (err) {
            logger.error(null, ["Failed to get teams: ", err.toString()]);
            res.status(500).send(err);
        }

        res.status(200).send(team);
    });
};

exports.removeTeam = function(req, res) {
    dbOperations.TeamModel.remove({
        _id: req.params.id
    }, function(err) {
        if (err) {
            logger.error(null, ["Failed to remove team: ", err.toString()]);
            res.status(500).send(err);
        }

        logger.info(null, ["Removed team: ", req.params.id]);
        res.status(200).end();
    });
};