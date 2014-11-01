var express = require('express');
var bodyParser = require('body-parser');
var serverLogger = require('./serverLogger');
var gameController = require('./game');
var bidController = require('./bid');

var logger = new serverLogger();
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

// ##### GAME ACTIONS #####

// For client - get games you can subscribe to
app.get('/getGames', gameController.getGames);

// For event managers - get waiting events
app.get('/getWaitingGames/:id', gameController.getWaitingGames);

// ## Create game entity in DB and start game
app.post('/createGame', gameController.createGame);

// Initialize previously created game
app.post('/initGame/:id', gameController.initGame);

// Assign specified game to specified manager
app.get('/assignGame/:gameId/:managerId', gameController.assignGame);

app.post('/closeGame/:id', gameController.closeGame);

// #### BID FUNCTIONS #####

// Adds bid entity to game (receives bid entity as parameter)
app.post('/addBid', bidController.addBid);

app.listen(app.get('port'), function () {
    logger.info("Node app is running at localhost:" + app.get('port'));
});
