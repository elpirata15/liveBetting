var chalk = require("chalk");
var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY
});

var ServerLogger = function ServerLogger(){

    this.info = function(gameId, args){
        var prefix = (gameId) ? "[GAME INFO] ("+gameId+") " : "[INFO]";
        console.log(prefix + args.join(' '));
    };
    this.error = function(gameId, args){
        var prefix = (gameId) ? "[GAME ERROR] ("+gameId+") " : "[ERROR]";
        console.error(chalk.red(prefix + args.join(' ')));
    };

};

module.exports = ServerLogger;
