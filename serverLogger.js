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
    this.info = function(messages){
        var pubnubMessages = [];
        pubnubMessages.push("Info: ");
        pubnubMessages = pubnubMessages.concat(messages);
        pubnub.publish({
            channel: this.gameId + 'adminSocket',
            message: pubnubMessages.join(' '),
            error: function(e){
                logger.error("publishing info message to PubNub failed: ", e);
            }
        });
        logger.info(messages);
    };
    this.error = function(messages){
        var pubnubMessages = [];
        pubnubMessages.push("Error: ");
        pubnubMessages = pubnubMessages.concat(messages);
        pubnub.publish({
            channel: this.gameId + 'adminSocket',
            message: pubnubMessages.join(' '),
            error: function(e){
                logger.error("publishing info message to PubNub failed: ", e);
            }
        });
        logger.error(messages);
    };

};

//ServerLogger.prototype.info =
//
//ServerLogger.prototype.error =

module.exports = ServerLogger;


