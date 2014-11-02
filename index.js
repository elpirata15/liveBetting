var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(express);
var serverLogger = require('./serverLogger');
var gameController = require('./game');
var bidController = require('./bid');

var secretKey = "ELFcjUgNvdKyiiaXDg2mnjPUgVAx6uaVlbdcqANvqgoyZeZVIxmqlOVykkmr2hcs";

var logger = new serverLogger();
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.session({ store: new RedisStore({
    host: 'pub-redis-18324.us-east-1-3.3.ec2.garantiadata.com',
    port: 18324,
    prefix: 'sess'
}), secret: secretKey }));
// ##### GAME ACTIONS #####

// For client - get games you can subscribe to
app.get('/getGames', gameController.getGames);

// Get single game info
app.get('/getGame/:id', gameController.getGames);

// For event managers - get waiting events
app.get('/getWaitingGames/:id', gameController.getWaitingGames);

// ## Create game entity in DB and start game
app.post('/createGame', gameController.createGame);

// Initialize previously created game
app.post('/initGame/:id', gameController.initGame);

// Assign specified game to specified manager
app.post('/assignGame/', gameController.assignGame);

app.post('/closeGame/:id', gameController.closeGame);

// #### BID FUNCTIONS #####

// Adds bid entity to game (receives bid entity as parameter)
app.post('/addBid', bidController.addBid);

app.get('/defaultLog', function(req, res){
    res.sendFile('default.log');
});

app.listen(app.get('port'), function () {
    logger.info("Node app is running at localhost:" + app.get('port'));
});
