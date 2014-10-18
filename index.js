var express = require('express');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var pubnub = require("pubnub").init({
    publish_key   : "pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151",
    subscribe_key : "sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe"
});
var bodyParser = require('body-parser');
var winston = require("winston");

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: 'default.log' })
    ]
});
var app = express();

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

var ObjectId = Schema.ObjectId;
var optionEntity = new Schema({
    optionDescription: String,
    optionOdds: Number
});

var bidRequestEntity = new Schema({
    userId: ObjectId,
    bidId: ObjectId,
    gameId: ObjectId,
    bidOption: Number,
    status: String,
    winAmount: Number
});

var bidEntity = new Schema({
    gameId:  ObjectId,
    gameName: String,
    bidDescription: String,
    bidType: String,
    bidOptions: [optionEntity],
    timestamp: Date,
    status: String,
    bidRequests: [bidRequestEntity],
    ttl: Number
});

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

// Find active games on server load - in case server fails
gameModel.find({status: 'Active'}, function(err, doc){
    for(var ind in doc){
        activeGames[doc[ind].id] = doc[ind];
    }
    logger.info('currently active games: ' + Object.keys(activeGames).length);
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
    logger.info("Initializing game: " + request.body.gameName);
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
            // Subscribe to game message socket
            pubnub.subscribe({
                channel : game.gameName,
                message : receiveBid,
                error: function(data){
                    logger.error(game.gameName+": "+data);
                },
                connect: function(data){
                    logger.info(game.gameName+": "+data);
                },
                disconnect: function(data){
                    logger.warn(game.gameName+": "+data);
                }
            });
            logger.info("Game initialized with id " +game.id);
            activeGames[game.id] = game;
            return response.status(200).send(game);
        }
        else {
            logger.error(err);
            return response.status(500).send(err);
        }
    });
});

app.post('/closeGame/:id', function(req, res){
    logger.info("Closing game:", req.params.id);
    gameModel.findOne({id: req.params.id}, function(err, doc){
        if(!err){
            doc.status = "Inactive";
            doc.save(function(err, game){
                if(!err){
                    logger.info("closed game",req.params.id,"successfully");
                    res.status(200).send(game);
                } else{
                    logger.error(err);
                    res.status(500).send(err);
                }
            });
        } else{
            logger.error(err);
            res.status(500).send(err);
        }

    });
});

// #### BID FUNCTIONS #####

// Adds bid entity to game (receives bid entity as parameter)
app.post('/addBid', function(req, res){
    logger.info("new bid opened in game " + req.body.gameName+": "+req.body.bidDescription);
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
                    logger.info("Bid opened successfully");
                    res.status(200).send(doc.bids[doc.bids.length -1]);
                } else{
                    logger.error(err);
                    res.status(500).send(err);
                }
            })
        }else{
            logger.error(err);
            res.status(500).send(err);
        }
    });
});

app.get('/closeBid', function(req, res){
    gameModel.findOne({id: req.body.gameId}, function(err, doc){
        if(!err){
            doc.bids.id(req.body.bidId).status = "Inactive";
        } else {
            logger.error(err);
            return res.status(500).send(err);
        }
    });
});

// ## receive bid request object from user through game message socket and add to db
var receiveBid = function(message, envelope, channel){
    logger.info("received bid request for game: "+channel);
    gameModel.findOne({id: message.gameId}, function(err, doc){
       if(!err){
           if(doc.bids.id(message.bidId).status == "Active"){
               doc.bids.bidRequests.push({
                   userId: message.userId,
                   bidId: message.bidId,
                   gameId: message.gameId,
                   bidOption: message.bidOption,
                   status: null,
                   winAmount: 0
               });
               doc.save(function(err){
                   if(!err){
                       logger.info("bid request added successfully");
                       return res.status(200).end();
                   } else{
                       logger.error(err);
                       return res.status(500).send(err);
                   }
               });
           } else {
               logger.warn("request made for inactive bid, request rejected");
               // send unauthorized code to client
               return res.status(403).send("Bid is inactive");
           }
       } else {
           logger.error(err);
           return res.status(500).send(err);
       }
    });
};


app.listen(app.get('port'), function() {
    logger.info("Node app is running at localhost:" + app.get('port'));
});
