var dbOperations = require('./dbOperations');
var serverLogger = require('./serverLogger');
var bcrypt = require('bcrypt-nodejs');

var logger = new serverLogger();

exports.getUsers = function (req, res) {
    logger.info(null, ['Getting all users']);
    dbOperations.UserModel.find({}, function (err, users) {
        if (!err) {
            res.status(200).send(users);
        } else {
            logger.error(null, [err]);
            res.status(500).send(err);
        }
    });
};

exports.getUsersByGroup = function (req, res) {
    logger.info(null, ["Getting all users for group ", req.params.group]);
    dbOperations.UserModel.find({group: req.params.group}, function (err, users) {
        if (!err) {
            res.status(200).send(users);
        } else {
            logger.error(null, [err]);
            res.status(500).send(err);
        }
    });
};

exports.getUserById = function (req, res) {
    logger.info(null, ["Getting user info for #", req.params.id]);
    dbOperations.UserModel.findOne({_id: req.params.id}, function (err, user) {
        if (!err) {
            res.status(200).send(user);
        } else {
            logger.error(null, [err]);
            res.status(500).send(err);
        }
    });
};

exports.getUserBidsFromSession = function (req, res) {
    var currDate = new Date();
    if(req.body.date){
        currDate = req.body.date;
    }
    logger.info(null, ["Getting bids for user ", req.session.uid, " for date ", currDate]);
    var startingDate = new Date(new Date(currDate).setHours(new Date(currDate).getHours() - 24));
    dbOperations.UserModel
        .where('_id',req.session.uid)
        .where('completedBids.gameDate').lte(currDate).gte(startingDate)
        .exec(function(err, foundBids){
            if(!err){
                logger.info(null, ["Found ", foundBids.length, " bids."]);
                res.status(200).send(foundBids);
            } else {
                logger.error(null, [err.toString()]);
                res.status(500).send(err.toString);
            }
        });
};

exports.getAllUserBids = function (req, res) {
    logger.info(null, ["Getting bids for user ", req.params.id]);
    dbOperations.UserModel.findOne({_id: req.params.id}, function(err, user){
        if(!err){
            logger.info(null, ["Found ", user.completedBids.length, " bids."]);
            res.status(200).send(user.completedBids);
        } else {
            logger.error(null, [err.toString()]);
            res.status(500).send(err.toString);
        }
    });
};

exports.registerUser = function (req, res) {
    if (!req.body._id) {
        logger.info(null, ["Creating new user ", req.body.email]);
    } else {
        logger.info(null, ["Updating user ", req.body.email]);
    }
    dbOperations.UserModel.findOne({email: req.body.email}, function (err, existingUser) {
        if (!err) {
            if (existingUser) {
                logger.error(null, ["A user with this E-mail address is already registered."]);
                res.status(500).send("A user with this E-mail address is already registered.");
            } else {
                bcrypt.hash(req.body.pass, null, null, function (err, hash) {
                    if (!err) {
                        var newUser;
                        if (!req.body._id) {
                            newUser = new dbOperations.UserModel({
                                email: req.body.email,
                                pass: hash,
                                fullName: req.body.fullName,
                                balance: 0,
                                group: req.body.group,
                                status: "Active"
                            });

                            newUser.save(function (err, user) {
                                if (!err) {
                                    logger.info(null, ["Registered user ", user.email, " with ID", user._id]);
                                    req.session.uid = user._id;
                                    req.session.group = user.group;
                                    res.status(200).send(user);
                                }
                            });
                        } else {
                            dbOperations.UserModel.findOne({_id: req.body._id}, function (err, user) {
                                if (!err) {
                                    user.email = req.body.email;
                                    user.pass = hash;
                                    user.fullName = req.body.fullName;
                                    user.group = req.body.group || "User";

                                    user.save(function (err, user) {
                                        if (!err) {
                                            logger.info(null, ["Updated user ", user.email]);
                                            req.session.uid = user._id;
                                            req.session.group = user.group;
                                            res.status(200).send(user);
                                        }
                                    });
                                } else {
                                    logger.error(null, [err]);
                                    res.status(500).send(err);
                                }
                            });
                        }

                    } else {
                        logger.error(null, [err]);
                        res.status(500).send(err);
                    }
                });
            }
        } else {
            logger.error(null, [err]);
            res.status(500).send(err);
        }
    });

};

exports.loginUser = function (req, res) {
    logger.info(null, ["login request by ", req.body.email]);
    dbOperations.UserModel.findOne({email: req.body.email}, function (err, user) {
        if (!err) {
            if (user) {
                bcrypt.compare(req.body.pass, user.pass, function (err, result) {
                    if (!err) {
                        if (result) {
                            req.session.uid = user._id;
                            req.session.group = user.group;
                            logger.info(null, ["request approved"]);
                            res.status(200).send(user);
                        } else {
                            logger.error(null, ["request denied: Passwords don't match"]);
                            res.status(401).send({error: "Passwords don't match"});
                        }
                    } else {
                        logger.error(err);
                        res.status(500).send(err);
                    }

                });
            } else {
                logger.error(null, ["request denied: No user by this name"]);
                res.status(401).send({error: "No user by this name"});
            }
        } else {
            res.status(500).send(err);
        }
    });
};

exports.logoutUser = function (req, res) {
    req.session = null;
    res.status(200).end();
};

exports.deleteUser = function (req, res) {
    dbOperations.UserModel.findOne({_id: req.params.id}, function (err, user) {
        if (!err) {
            user.status = "Inactive";
            user.save(function (err, user) {
                if (!err) {
                    res.status(200).end();
                } else {
                    res.status(500).send(err);
                }
            });
        } else {
            res.status(500).send(err);
        }
    });
};

exports.changeUserGroup = function (req, res) {
    dbOperations.UserModel.findOne({email: req.body.email}, function (err, user) {
        if (!err) {
            user.group = req.body.group;
            user.save(function (err, user) {
                if (!err) {
                    logger.info(null, ["changed user ", user.email, " group to ", user.group]);
                    res.status(200).send("Successful. please re-login.");
                } else {
                    res.status(500).send(err);
                }
            });
        } else {
            res.status(500).send(err);
        }
    });
};