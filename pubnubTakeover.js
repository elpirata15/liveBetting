var gameController = require('./game');
var bidController = require('./bid');
var dbOperations = require('./dbOperations');
var instanceName = process.env.$DYNO;

var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY,
    uuid: instanceName,
    heartbeat: 15
});

// Subscribe to servers channel
pubnub.subscribe({
    channel: "servers",
    connect: function () {
        console.log(instanceName + " connected to servers channel");
    },
    disconnect: function () {
        console.log(instanceName + " disconnected from servers channel");
    },
    presence: function (m) {
        checkTakeOver(m);
    }
});

var serversChannelMap = {};

var checkTakeOver = function (message) {
    // If this is a timeout - a server dropped
    if (message.action == "timeout") {
        // Get the lost server name
        var lostServer = message.uuid;

        console.error("server", lostServer, "was lost! trying to take over.");

        // Get the remaining servers
        pubnub.here_now({
            channel: 'servers',
            callback: function(m){
                for(var i in m.uuids){
                    // Create a channel map
                    serversChannelMap[m.uuids[i]] = null;
                }

                // Get the remaining instance names
                var subscribedServers = m.uuids;
                // Set laziest server (the one with the least channels subscribed)
                var laziestServer = subscribedServers[0];

                // Loop through remaining servers
                for(var i in subscribedServers){

                    // Get number of channels subscribed
                    pubnub.where_now({
                        uuid: subscribedServers[i],
                        callback: function(m){

                            // Set number of subscribed channels in the server map
                            serversChannelMap[subscribedServers[i]] = m.channels.length;

                            // Query not complete flag
                            var nullFound = false;

                            // Loop through remaining servers
                            for(var i in subscribedServers){
                                // If we found a null server
                                if(serversChannelMap[subscribedServers[i]] == null){
                                    // The query is not complete keep going with the where_now query
                                    nullFound = true;
                                    break;
                                } else {
                                    // Check if this is the laziest server
                                    if(serversChannelMap[subscribedServers[i]] < serversChannelMap[laziestServer]){
                                        laziestServer = subscribedServers[i];
                                    }
                                }
                            }
                            // If the query is complete
                            if(!nullFound){
                                // Get the channels the lost server was subscribed to
                                pubnub.where_now({
                                    uuid: lostServer,
                                    callback: function(m){

                                        // If the laziest server is the current instance
                                        if(laziestServer == instanceName){
                                            console.info("will take over using instance", laziestServer);
                                            // Perform take over
                                            this.performTakeOver(m);
                                        }


                                    },
                                    error: function (m) {
                                        console.error(m);
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }
};

exports.performTakeOver = function (message) {

    console.log("Performing take over");

    var channelMap = {};

    // make map out of message channels
    for (var i in message.channels) {
        channelMap[message.channels[i]] = true;
    }

    // Find which of the id's are games
    dbOperations.GameModel.find({'_id': {$in: message.channels}}, function (err, games) {
        if(!err) {
            if (games && games.length > 0) {
                for (var i in games) {
                    // perform game re-subscription
                    gameController.subscribeToPubnub(games[i]);

                    console.log("Took over game:", games[i]._id);

                    // delete games from channels list
                    delete channelMap[games[i]._id];
                }
            }

            // Get the remaining channels (bid channels)
            var remainingChannels = Object.keys(channelMap);

            // Loop through the remaining channels
            for(var i in remainingChannels){
                // Get the bid entity from the cache
                dbOperations.getBidEntity(remainingChannels[i], function(bid){
                    // Set the ui updating interval
                    bidController.setUiUpdaterInterval(bid);

                    // Re - subscribe to the bid channel
                    bidController.subscribeBidToPubnub(bid);

                    console.log("Took over bid:", bid.id);
                });

            }
        } else {
            console.error("Failed to contact database for failed instance takeover");
        }


    });


};
