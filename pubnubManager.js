var pubnub = require("pubnub");
var UUID = pubnub.db.get('session') || (function(){
        var uuid = punub.uuid();
        PUBNUB.db.set( 'session',uuid);
        return uuid;
    })();
var instanceName = UUID;
pubnub.init({
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

