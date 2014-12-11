var instanceName = process.env.DYNO;
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
        console.log("[INFO] Connected to server pool");
    },
    disconnect:function(){
        console.log("[INFO] Disconnected from server pool");
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

