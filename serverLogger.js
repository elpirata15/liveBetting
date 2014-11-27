var winston = require("winston");
var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
});

var ServerLogger = function ServerLogger(gameId){

    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({filename: (gameId)? gameId+".log" : "default.log"})
        ]
    });

    this.gameId = gameId || "";

    this.info = function(){
        var pubnubMessages = [];
        pubnubMessages.push("Info: ");
        for(var i in arguments){
            pubnubMessages.push(arguments[i]);
        }
        pubnub.publish({
            channel: this.gameId + 'adminSocket',
            message: pubnubMessages.join(''),
            error: function(e){
                logger.error("publishing info message to PubNub failed: ", e);
            }
        });
        logger.info(pubnubMessages.join(''));
    };
    this.error = function(){
        var pubnubMessages = [];
        pubnubMessages.push("Error: ");
        for(var i in arguments){
            pubnubMessages.push(arguments[i]);
        }
        pubnub.publish({
            channel: this.gameId + 'adminSocket',
            message: pubnubMessages.join(''),
            error: function(e){
                logger.error("publishing info message to PubNub failed: ", e);
            }
        });
        logger.error(pubnubMessages.join(''));
    };

};

// per game loggers
var gameLoggers = {};

ServerLogger.prototype.gameLogger = {
    setLogger: function (gameId) {
        gameLoggers[gameId] = new ServerLogger(gameId);
    },
    removeLogger: function (gameId) {
        delete gameLoggers[gameId];
    },
    log: function(){
        var logString = "";
        for(var i = 1; i<arguments.length; i++)
        {
            logString += arguments[i];
        }
        gameLoggers[arguments[0]].info(logString);
    }
};


module.exports = ServerLogger;


