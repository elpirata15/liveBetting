require('newrelic');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var serverLogger = require('./serverLogger');
var gameController = require('./game');
var bidController = require('./bid');
var userController = require('./user');
var teamContoller = require('./team');
var reportingController = require('./reports');
if(!process.env.NODE_ENV || process.env.NODE_ENV !== "dev") {
    var pubnubManager = require('./pubnubManager');
}
var mailer = require('./mailer');
var http = require('http');


var secretKey = "ELFcjUgNvdKyiiaXDg2mnjPUgVAx6uaVlbdcqANvqgoyZeZVIxmqlOVykkmr2hcs";

var logger = new serverLogger();
var app = express();
var day = 1000 * 60 * 60 * 24;

app.set('port', (process.env.PORT || 5000));
app.set('host', process.env.IP);
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: secretKey,
    cookie: {
        secure: true,
        maxAge: day,
        signed: true,
        overwrite: true
    },
    saveUninitialized: true,
    resave: true
}));

// ### GENERAL ERROR HANDLER ######
app.use(function(err, req, res, next) {
    console.error(err.stack);
    pubnubManager.removeFromPool(function() {
        mailer.sendErrorEmail(err.stack);
        setTimeout(function() {
            process.exit(1);
        }, 10);
    });

});

function exitGracefully() {
    pubnubManager.removeFromPool(function() {
        process.exit(0);
    });
}

process.on('SIGINT', function() {
    exitGracefully();
});

process.on('SIGTERM', function() {
    exitGracefully();
});
// ################################

setInterval(function() {
    http.get("http://pubnub-balancer.herokuapp.com/").on('error', function(e) {
        console.log("Got error: " + e.message);
    });

}, 60000);

// #### USER GROUP RESTRICTION HELPER FUNCTIONS ######

function ensureAdmin(req, res, next) {
    if (req.session && req.session.group == "Admins") {
        return next();
    }
    else {
        res.status(403).send("Forbidden");
    }
}

function ensureUser(req, res, next) {
    if (req.session) {
        return next();
    }
    else {
        res.status(403).send("Forbidden");
    }
}

function ensureMaster(req, res, next) {
    if (req.session && (req.session.group == "Masters" || req.session.group == "Admins")) {
        return next();
    }
    else {
        res.status(403).send("Forbidden");
    }
}

function ensureManager(req, res, next) {
    if (req.session && (req.session.group == "Masters" || req.session.group == "Admins" || req.session.group == "Managers")) {
        return next();
    }
    else {
        res.status(403).send("Forbidden");
    }
}

// ##### GAME ACTIONS #####

// For client - get games you can subscribe to
app.get('/getGames', ensureUser, gameController.getGames);

// Get single game info
app.get('/getGame/:id', ensureMaster, gameController.getGame);

// For event managers - get waiting events
app.get('/getWaitingGames/:id', ensureManager, gameController.getWaitingGames);

app.get('/getActiveGamesId', ensureMaster, gameController.getLiveGameList);

// ## Create game entity in DB and start game
app.post('/createGame', ensureMaster, gameController.createGame);

// Initialize previously created game
//app.post('/initGame/', ensureManager, gameController.initGame);

// Initialize previously created game: FOR DEV
app.post('/initGame/:id', ensureManager, gameController.initGame);

// Assign specified game to specified manager
app.post('/assignGame/', ensureMaster, gameController.assignGame);

app.post('/closeGame/:id', ensureManager, gameController.closeGame);

app.get('/getGameTeams/:id', ensureManager, gameController.getGameTeams);

app.post('/getGamesMap', reportingController.getRevenueReport);

app.post('/startGame/:id', ensureManager, gameController.startGame);

app.post('/setHalfTime/:id', ensureManager, gameController.setHalfTime);

// #### BID FUNCTIONS #####

// Adds bid entity to game (receives bid entity as parameter)
app.post('/addBid', ensureManager, bidController.addBid);

// Creates a new ID object to send with bidEntity
app.get('/newBidId', ensureManager, bidController.newId);

// ###### USER FUNCTIONS ######
app.get('/getUsers', ensureAdmin, userController.getUsers);

app.get('/getUser/:id', ensureAdmin, userController.getUserById);

app.post('/getUserBids', ensureUser, userController.getUserBidsFromSession);

app.get('/getAllUserBids/:id', ensureAdmin, userController.getAllUserBids);

app.get('/getUsersByGroup/:group', ensureManager, userController.getUsersByGroup);

app.post('/login', userController.loginUser);

app.post('/logout', userController.logoutUser);

app.post('/register', userController.registerUser);

app.post('/changeGroup', userController.changeUserGroup);

// ######### TEAM FUNCTIONS #########

app.post('/createOrUpdateTeam', ensureMaster, teamContoller.newTeam);

app.get('/removeTeam/:id', ensureManager, teamContoller.removeTeam);

app.get('/getTeam/:id', ensureManager, teamContoller.getTeam);

app.get('/getTeamPlayers/:id', ensureManager, teamContoller.getTeamPlayers);

app.get('/getTeams', ensureManager, teamContoller.getTeams);

// #######################################

app.get('/defaultLog', ensureAdmin, function(req, res) {
    res.sendFile('default.log');
});

if (app.get('host')) {
    app.listen(app.get('port'), app.get('host'), function() {
        logger.info(null, ["Node app is running at " + app.get('host') + ":" + app.get('port')]);
    });
}
else {
    app.listen(app.get('port'), function() {
        logger.info(null, ["Node app is running at localhost:" + app.get('port')]);
    });
}
