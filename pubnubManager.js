var instanceName = "server_"+process.env.DYNO;
var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY,
    uuid: instanceName,
    heartbeat: 20
});
var gameController = require('./game');
var bidController = require('./bid');
var gcm = require('node-gcm');
var GCM_API_KEY = "AIzaSyD8Kwu0Ld_2K9meKX4xSbYKkGJgcl-vsAs";
var gcmClients = {};
var apnClients = {};
var gcmSender = new gcm.Sender(GCM_API_KEY);

var addClient = function(req, res){
    var gameId = req.params.id;
    var clientId = req.params.token;
    if(req.params.type === 'gcm') {
        if (!gcmClients[gameId]) {
            gcmClients[gameId] = [];
        }

        if (gcmClients[gameId].indexOf(clientId) === -1) {
            gcmClients[gameId].push(clientId);
        }
    }

    res.status(200).end();
};

var sendGcm = function(gcmMessage){

    var gameId = gcmMessage.data.gameId;
    var message = new gcm.Message({
        timeToLive: 2,
        data: gcmMessage.data
    });

    gcmSender.send(message, gcmClients[gameId], function (err, result) {
        if(err) console.error(err);
        else    console.log(result);
    });
};

if(!process.env.NODE_ENV || process.env.NODE_ENV !== "dev") {
    pubnub.subscribe({
        channel: "servers",
        callback: function (m) {
            console.log(m);
        },
        connect: function () {
            console.log("[INFO] Connected", instanceName, "to server pool");
        },
        disconnect: function () {
            console.log("[INFO] Disconnected", instanceName, "from server pool");
        }
    });
    console.log(instanceName);
    pubnub.subscribe({
        channel: instanceName,
        message: function (m) {
            if(m.lb_gcm){
                sendGcm(m.lb_gcm);
            }
            if (m.bidEntity) {
                bidController.addBid(m);
            } else if (m.bidRequest) {
                bidController.addBidRequest(m.bidRequest);
            }
        }
    });
}
var removeFromPool = function(callback){
  pubnub.unsubscribe({
      channel: 'servers',
      callback: function(){
          console.log("[INFO] Disconnected",instanceName, "from server pool");
          callback();
      }
  });
};

var publishMessage = function(channel, message){
    pubnub.publish({
        channel: channel,
        message: message
    });
};

module.exports = {publishMessage: publishMessage, removeFromPool: removeFromPool, sendGcm: sendGcm, addClient: addClient};

