var chalk = require("chalk");
var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
});

var ServerLogger = function ServerLogger(gameId){

    this.gameId = gameId || "";

    this.info = function(){
        var pubnubMessages = [];
        for(var i in arguments){
            pubnubMessages.push(arguments[i]);
        }
        var prefix = (this.gameId) ? "[GAME INFO] ("+this.gameId+") " : "[INFO]";
        console.log(prefix + pubnubMessages.join(''));
    };
    this.error = function(){
        var pubnubMessages = [];
        for(var i in arguments){
            pubnubMessages.push(arguments[i]);
        }
        var prefix = (this.gameId) ? "[GAME ERROR] ("+this.gameId+") " : "[ERROR]";
        console.log(chalk.red(prefix + pubnubMessages.join('')));
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
    },
    error: function(){
        var logString = "";
        for(var i = 1; i<arguments.length; i++)
        {
            logString += arguments[i];
        }
        gameLoggers[arguments[0]].error(logString);
    }
};


module.exports = ServerLogger;


