var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

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
    winAmount: Number,
    betAmount: Number
});

var bidEntity = new Schema({
    gameId: ObjectId,
    gameName: String,
    bidDescription: String,
    bidType: String,
    bidOptions: [optionEntity],
    winningOption: Number,
    timestamp: Date,
    status: String,
    bidRequests: [bidRequestEntity],
    ttl: Number
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
    activeGames: {}

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
    if (cache[cacheString].hasOwnProperty(entityId)) {
        callback(cache[cacheString][entityId]);
    } else {
        gameModel.findOne({_id: entityId}, function (err, doc) {
            if (!err || !doc || doc != undefined) {
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
    delete cache[cacheType][entity._id];
};

var cacheEntity = exports.cacheEntity = function (cacheType, entity) {
    return cache[cacheType][entity._id] = entity;
};