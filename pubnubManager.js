var instanceName = "server_" + process.env.DYNO;
var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY,
    uuid: instanceName,
    heartbeat: 20
});
var gameController = require('./game');
var bidController = require('./bid');
var dbOperations = require('./dbOperations');
var gcm = require('node-gcm');
var GCM_API_KEY = "AIzaSyD8Kwu0Ld_2K9meKX4xSbYKkGJgcl-vsAs";
var apnClients = {};

var gcmSender = new gcm.Sender(GCM_API_KEY);

exports.addClient = function (req, res) {
    var gameId = req.params.id;
    var clientId = req.params.token;
    if (req.params.type === 'gcm') {
        dbOperations.getGCMClients(function (gcmClients) {
            if(gcmClients == null){
                gcmClients = {};
            }
            if (!gcmClients[gameId]) {
                gcmClients[gameId] = [];
            }

            if (gcmClients[gameId].indexOf(clientId) === -1) {
                gcmClients[gameId].push(clientId);
            } else {
                res.status(400).send("Client is already in list");
            }
            dbOperations.setGCMClients(gcmClients);
            console.log("added",clientId, "to gcm channel",gameId);
            res.status(200).end();
        });
    }
};

exports.removeClient = function (req, res) {
    var gameId = req.params.id;
    var clientId = req.params.token;
    if (req.params.type === 'gcm') {
        dbOperations.getGCMClients(function(gcmClients){
            if(gcmClients == null){
                res.status(500).send("failed to get gcm clients");
            }

            var clientIndex = gcmClients[gameId].indexOf(clientId);
            if (clientIndex > -1) {
                gcmClients[gameId].splice(clientIndex, 1);
            } else {
                res.status(400).send("Client is not in list");
            }

            dbOperations.setGCMClients(gcmClients);
            console.log("removed",clientId, "from gcm channel",gameId);
            res.status(200).end();
        });
    }
};

exports.deleteClientsFromGame = function (gameId) {
    dbOperations.getGCMClients(function(gcmClients) {
        if (gcmClients == null) {
            res.status(500).send("failed to get gcm clients");
        }

        delete gcmClients[gameId];

        dbOperations.setGCMClients(gcmClients);
        console.log("removed gcm channel",gameId);
    });
};

exports.sendGcm = function (gcmMessage) {
    dbOperations.getGCMClients(function(gcmClients) {
        var gameId = gcmMessage.data.gameId;
    
        if (gcmClients == null || !gcmClients[gameId]) {
            console.log("no gcm clients on channel");
            return;
        }
        
        var message = new gcm.Message({
            timeToLive: 2,
            data: gcmMessage.data
        });

        gcmSender.send(message, gcmClients[gameId], function (err, result) {
            if (err) console.error(err);
            else    console.log(result);
        });
    });
};

if (!process.env.NODE_ENV || process.env.NODE_ENV !== "dev") {
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
            if (m.lb_gcm) {
                this.sendGcm(m.lb_gcm);
            }
            if (m.bidEntity) {
                bidController.addBid(m);
            } else if (m.bidRequest) {
                bidController.addBidRequest(m.bidRequest);
            }
        }
    });
}
exports.removeFromPool = function (callback) {
    pubnub.unsubscribe({
        channel: 'servers',
        callback: function () {
            console.log("[INFO] Disconnected", instanceName, "from server pool");
            callback();
        }
    });
};

exports.publishMessage = function (channel, message) {
    pubnub.publish({
        channel: channel,
        message: message
    });
};

