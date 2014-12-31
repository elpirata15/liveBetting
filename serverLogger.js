var chalk = require("chalk");
var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
});

var ServerLogger = function ServerLogger(){

    this.info = function(gameId, args){
        var prefix = (gameId) ? "[GAME INFO] ("+this.gameId+") " : "[INFO]";
        console.log(prefix + args.join());
    };
    this.error = function(gameId, args){
        var prefix = (gameId) ? "[GAME ERROR] ("+this.gameId+") " : "[ERROR]";
        console.log(chalk.red(prefix + args.join()));
    };

};

module.exports = ServerLogger;
