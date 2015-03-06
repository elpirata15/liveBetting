var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
//var NodeCache = require("node-cache");
var redis = require("redis");

var redisClient = redis.createClient(process.env.REDISCLOUD_PORT, process.env.REDISCLOUD_HOST);

redisClient.auth(process.env.REDISCLOUD_PASS, function () {
    console.log("[INFO]Redis Connected");
});

var ObjectId = Schema.ObjectId;

exports.ObjectId = function () {
    return mongoose.Types.ObjectId();
};

exports.getObjectIdFromString = function (idString) {
    var typedObjectId = mongoose.Types.ObjectId;
    return typedObjectId(idString);
};

var playerEntity = new Schema({
   playerName: String,
   playerNumber: Number
});

var teamEntity = new Schema({
   teamName: String,
   teamLeagues: [String],
   teamCountry: String,
   players: [playerEntity]
});

exports.TeamModel = mongoose.model('teams', teamEntity);

var participantEntity = new Schema({
    userId: ObjectId,
    amount: Number,
    timestamp: Date,
    optionIndex: Number
});

var optionEntity = new Schema({
    optionDescription: String,
    participants: [participantEntity]
});

var bidEntity = new Schema({
    id: ObjectId,
    gameId: ObjectId,
    gameName: String,
    bidDescription: String,
    bidType: String,
    timestamp: Date,
    status: String,
    ttl: Number,
    bidOptions: [optionEntity],
    totalPoolAmount: Number,
    entryAmount: Number,
    winningOption: Number
}, {_id: false});

var gameEntity = new Schema({
    gameName: String,
    teams: [ObjectId],
    assignedTo: String,
    gameScore: String,
    location: String,
    timestamp: Date,
    statusTimestamp: Date,
    gameLeague: String,
    status: Number,
    tvDelay: Number,
    bids: [bidEntity]
});

var gameModel = exports.GameModel = mongoose.model('games', gameEntity);

var completedOptionEntity = new Schema({
    optionDescription: String,
    participants: Number
});

var completeBidEntity = new Schema({
    bidId: String,
    bidDescription: String,
    bidType: String,
    gameName: String,
    gameId: ObjectId,
    gameDate: Date,
    bidTimestamp: Date,
    totalPoolAmount: Number,
    entryAmount: Number,
    bidOptions: [completedOptionEntity],
    selectedOption: Number,
    winningOption: Number,
    moneyWon: Number
});

var userEntity = new Schema({
    email: String,
    pass: String,
    fullName: String,
    balance: Number,
    completedBids: [completeBidEntity],
    group: String, //Admins, Users, Managers, Masters
    status: String, // Active, Inactive
    uuid: String
});

exports.UserModel = mongoose.model('users', userEntity);

var options = {
    user: 'elirankon',
    pass: 'elirankon86',
    replset: {socketOptions: {keepAlive: 1}}
};

mongoose.connect(process.env.MONGOLAB_URI, options);

// ************** ENTITY CACHING *********************
exports.caches = {gameCache: "activeGames", bidCache: "activeBids"};


// ** DB FUNCTION WITH CACHING **
exports.updateDb = function (entity, cacheType, callback, errCallback) {
    return entity.save(function (err, savedEntity) {
        if (!err) {
            cacheEntity(cacheType, savedEntity);
            callback(savedEntity);
        } else {
            errCallback(err);
        }
    });
};

exports.getEntity = function (entityId, cacheType, callback) {
    redisClient.get(cacheType + "_" + entityId, function (err, cachedEntity) {
        if (cachedEntity) {
            callback(JSON.parse(cachedEntity));
        } else {
            gameModel.findOne({_id: entityId}, function (err, doc) {
                if (!err || !doc || doc !== undefined) {
                    cacheEntity(cacheType, doc);
                    callback(doc);
                }
                else {
                    callback(false);
                }
            });
        }
    });
};

exports.setGCMClients = function(clients){
    redisClient.set("gcm_clients",JSON.stringify(clients));
};

exports.getGCMClients = function(callback){
    redisClient.get("gcm_clients",function(err, clients){
        if(err){
            console.error("failed to get GCM clients", err);
            return null;
        }

        if(clients != null){
            callback(JSON.parse(clients));
        } else {
            callback(null);
        }
        
    });
};

exports.uncacheEntity = function (cacheType, entity) {
    var key = entity._id || entity;
    redisClient.del(cacheType + "_" + key);
    console.log("[INFO] Deleted " + cacheType + "_" + key + " from cache");
};

var cacheEntity = exports.cacheEntity = function (cacheType, entity) {
    // Set expiration for 2 hours
    var key = entity._id || entity.entity.id;
    redisClient.setex(cacheType + "_" + key, 7200, JSON.stringify(entity));
};

exports.getBidEntity = function (entityId, callback) {
    redisClient.get(this.caches.bidCache + "_" + entityId, function (err, bid) {
        if (!err) {
            if (bid != null) {
                callback(JSON.parse(bid));
            }
        } else {
            console.error(err);
        }
    })
};
