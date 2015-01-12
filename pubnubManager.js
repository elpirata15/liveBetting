var uuid = require('node-uuid');
var instanceName = uuid.v1();
var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY,
    uuid: instanceName
});
var gameController = require('./game');
var bidController = require('./bid');

pubnub.subscribe({
   channel: "servers",
    callback: function(m){
      console.log(m);
    },
    connect: function(){
        console.log("[INFO] Connected",instanceName, "to server pool");
    },
    disconnect:function(){
        console.log("[INFO] Disconnected",instanceName, "from server pool");
    },
    heartbeat: 15
});
console.log(instanceName);
pubnub.subscribe({
   channel: instanceName,
    message: function(m){
        if(m.bidEntity){
            bidController.addBid(m);
        } else if(m.bidRequest){
            bidController.addBidRequest(m.bidRequest);
        }
    }
});

exports.removeFromPool = function(callback){
  pubnub.unsubscribe({
      channel: 'servers',
      callback: function(){
          console.log("[INFO] Disconnected",instanceName, "from server pool");
          callback();
      }
  });
};

