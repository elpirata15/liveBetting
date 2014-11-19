var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var NodeCache = require("node-cache");

var ObjectId = exports.ObjectId = Schema.ObjectId;

var participantEntity = new Schema({
    userId: ObjectId,
    amount: Number
});

var optionEntity = new Schema({
    optionDescription: String,
    automaticLoser: Boolean, // True/False if it's an automaticLoser option (each bidEntity will have 1 of these)
    participants: [participantEntity]
});

/*var bidRequestEntity = new Schema({
    userId: ObjectId,
    bidId: ObjectId,
    gameId: ObjectId,
    bidOption: Number,
    status: String,
    winAmount: Number,
    betAmount: Number
});*/

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
});

var gameEntity = new Schema({
    gameName: String,
    teams: [String],
    assignedTo: String,
    location: String,
    timestamp: Date,
    type: String,
    status: String,
    bids: [bidEntity]
});

var gameModel = exports.GameModel = mongoose.model('games', gameEntity);

var userEntity = new Schema({
    email: String,
    pass: String,
    fullName: String,
    balance: Number,
    group: String, //Admins, Users, Managers, Masters
    status: String // Active, Inactive
});

exports.UserModel = mongoose.model('users', userEntity);

var options = {
    user: 'root',
    pass: 'elirankon86',
    replset: {socketOptions: {keepAlive: 1}}
};

mongoose.connect("mongodb://ds047050.mongolab.com:47050/heroku_app30774540", options);

// ************** ENTITY CACHING *********************
// Active games cache
var cache = {
    activeGames: new NodeCache({stdTTL: 300, checkPeriod: 60})
};

// ** DB FUNCTION WITH CACHING **
exports.updateDb = function (entity, callback, errCallback) {
    return entity.save(function (err, savedEntity) {
        if (!err) {
            cacheEntity("activeGames", savedEntity);
            callback(savedEntity);
        } else {
            errCallback(err);
        }
    });
};

exports.getEntity = function (entityId, cacheType, callback) {
    var cacheString = cacheType ? cacheType : "activeGames";
    var cachedEntity = cache[cacheString].get(entityId);
    if (Object.keys(cachedEntity).length) {
        callback(cachedEntity[entityId]);
    } else {
        gameModel.findOne({_id: entityId}, function (err, doc) {
            if (!err || !doc || doc !== undefined) {
                cacheEntity(cacheType ? cacheType : "activeGames", doc);
                callback(doc);
            }
            else {
                callback(false);
            }
        });
    }

};

exports.uncacheEntity = function (cacheType, entity) {
    cache[cacheType].del([entity._id]);
};

var cacheEntity = exports.cacheEntity = function (cacheType, entity) {
    cache[cacheType].set([entity._id], entity);
};