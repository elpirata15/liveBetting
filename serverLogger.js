var winston = require("winston");
var pubnub = require("pubnub").init({
    publish_key: "pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151",
    subscribe_key: "sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe"
});

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({filename: 'default.log'})
    ]
});

var ServerLogger = function ServerLogger(gameId){

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
        logger.info(pubnubMessages);
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
        logger.error(pubnubMessages);
    };

};

//ServerLogger.prototype.info =
//
//ServerLogger.prototype.error =

module.exports = ServerLogger;


