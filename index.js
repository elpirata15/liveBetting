var express = require('express');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var pubnub = require("pubnub").init({
    publish_key   : "pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151",
    subscribe_key : "sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe"
});
var bodyParser = require('body-parser');
var winston = require("winston");

var app = express();

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

var ObjectId = Schema.ObjectId;
var optionEntity = new Schema({
    optionDescription: String,
    optionOdds: Number
});

var bidEntity = new Schema({
    gameId:  ObjectId,
    gameName: String,
    bidDescription: String,
    bidType: String,
    bidOptions: [optionEntity],
    timestamp: Date,
    status: String,
    ttl: Number
});

//var bidModel = mongoose.model('bids', bidEntity);

var gameEntity = new Schema({
    gameName: String,
    teams: [String],
    location: String,
    timestamp: Date,
    type: String,
    status: String,
    bids: [bidEntity]
});

var gameModel = mongoose.model('games', gameEntity);

var bidRequestEntity = new Schema({
    userId: ObjectId,
    bidId: ObjectId,
    gameId: ObjectId,
    bidOption: Number,
    status: String,
    winAmount: Number
});

var bidRequestModel = mongoose.model('bid_requests', bidRequestEntity);

var userEntity = new Schema({
    email: String,
    pass: String,
    fullName: String
});

var userModel = mongoose.model('users', userEntity);

mongoose.connect("mongodb://root:elirankon86@ds047050.mongolab.com:47050/heroku_app30774540");

// #################################################################################################

// Active games cache
var activeGames = {};

gameModel.find({status: 'Active'}, function(err, doc){
    for(var ind in doc){
        activeGames[doc[ind].id] = doc[ind];
    }
    winston.info('currently active games: ' + Object.keys(activeGames).length);
});


app.get('/', function(request, response) {
  response.send('Hello World!')
});

// ##### GAME ACTIONS #####

app.get('/getGames', function(req, res){
    var arrActiveGames = [];
    for(gameId in activeGames){
        arrActiveGames.push(activeGames[gameId]);
    }
    return res.status(200).send(arrActiveGames);
});

// ## Create game entity in DB and start game

app.post('/initGame', function(request, response){
    winston.info("Initializing game: " + request.body.gameName);
    var newGame = new gameModel({
        gameName: request.body.gameName,
        teams: request.body.teams,
        timestamp: Date.now(),
        location: request.body.location,
        type: request.body.type,
        status: "Active"
    });

    newGame.save(function(err, game){
        if(!err){
            winston.info("Game initialized with id " +game.id);
            activeGames[game.id] = game;
            return response.status(200).send(game);
        }
        else {
            winston.error(err);
            return response.status(500).send(err);
        }
    });
});

app.post('/closeGame', function(req, res){
    winston.info("Closing game: " + req.body.id);
    gameModel.findOne({id: req.body.id}, function(err, doc){
        if(!err){
            doc.status = "Inactive";
            doc.save(function(err, game){
                if(!err){
                    res.status(200).send(game);
                } else{
                    res.status(500).send(err);
                }
            });
        } else{
            res.status(500).send(err);
        }

    });
});

// #### BID FUNCTIONS #####

// Adds bid entity to game (receives bid entity as parameter)
app.post('/addBid', function(req, res){
    winston.info("new bid opened in game " + req.body.gameName+": "+req.body.bidDescription);
    gameModel.findOne({id: req.body.gameId}, function(err, doc){
        if(!err){
            doc.bids.push({
                gameId: doc.id,
                gameName: doc.gameName,
                bidDescription: req.body.bidDescription,
                bidType: req.body.bidType,
                bidOptions: req.body.bidOptions,
                timestamp: Date.now(),
                status: "Active",
                ttl: req.body.ttl
            });
            doc.save(function(err){
                if(!err){
                    res.status(200).send(doc.bids[doc.bids.length -1]);
                } else{
                    res.status(500).send(err);
                }
            })
        }else{
            res.status(500).send(err);
        }
    });
});

app.listen(app.get('port'), function() {
  winston.info("Node app is running at localhost:" + app.get('port'));
});
