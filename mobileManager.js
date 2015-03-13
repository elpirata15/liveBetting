var dbOperations = require('./dbOperations');
var gcm = require('node-gcm');
var apn = require('apn');
var async = require('async');
var GCM_API_KEY = "AIzaSyDITTr4o_RWyPmcHp81GNDbUZ3H-_azOqQ";

var gcmSender = new gcm.Sender(GCM_API_KEY);
var apnConnection = new apn.Connection({
    pfx: 'sandbox.p12',
    passphrase: '1'
});
apnConnection.on("transmitted", function(notification, device) {
    console.log("Notification transmitted to:" + device.token.toString("hex"));
});

apnConnection.on("transmissionError", function(errCode, notification, device) {
    console.error("Notification caused error: " + errCode + " for device ", device, notification);
    if (errCode === 8) {
        console.log("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
    }
});

exports.addClients = function(req, res) {
    var games = req.body.games;
    var clientId = req.body.token;
    var response = [];
    if (req.body.type === 'gcm') {
        dbOperations.getGCMClients(function(gcmClients) {
            if (gcmClients == null) {
                gcmClients = {};
            }
            for (var game in games) {
                var gameId = games[game];
                if (!gcmClients[gameId]) {
                    gcmClients[gameId] = [];
                }

                if (gcmClients[gameId].indexOf(clientId) === -1) {
                    gcmClients[gameId].push(clientId);
                    console.log("added", clientId, "to gcm channel", gameId);
                    response.push({
                        gameId: gameId,
                        status: 200
                    });
                }
                else {
                    response.push({
                        gameId: gameId,
                        status: 400,
                        message: "Client is already in list"
                    });
                }


            }
            dbOperations.setGCMClients(gcmClients);
        });

    }
    else if (req.body.type === 'apn') {
        var hex, i;
        var apnClientId = "";
        for (i=0; i<this.length; i++) {
            hex = this.charCodeAt(i).toString(16);
            apnClientId += ("000"+hex).slice(-4);
        }
        dbOperations.getAPNClients(function(apnClients) {
            if (apnClients == null) {
                apnClients = {};
            }
            for (var game in games) {
                var gameId = games[game];
                if (!apnClients[gameId]) {
                    apnClients[gameId] = [];
                }

                if (apnClients[gameId].indexOf(apnClientId) === -1) {
                    apnClients[gameId].push(apnClientId);
                    console.log("added", apnClientId, "to apn channel", gameId);
                    response.push({
                        gameId: gameId,
                        status: 200
                    });
                }
                else {
                    response.push({
                        gameId: gameId,
                        status: 400,
                        message: "Client is already in list"
                    });
                }


            }
            dbOperations.setAPNClients(apnClients);
        });

    }
    else {
        res.status(400).send("Invalid notification type");
    }

    res.status(200).send(response);
}

exports.addClient = function(req, res) {
    var gameId = req.params.id;
    var clientId = req.params.token;
    if (req.params.type === 'gcm') {
        dbOperations.getGCMClients(function(gcmClients) {
            if (gcmClients == null) {
                gcmClients = {};
            }
            if (!gcmClients[gameId]) {
                gcmClients[gameId] = [];
            }

            if (gcmClients[gameId].indexOf(clientId) === -1) {
                gcmClients[gameId].push(clientId);
            }
            else {
                res.status(400).send("Client is already in list");
            }
            dbOperations.setGCMClients(gcmClients);
            console.log("added", clientId, "to gcm channel", gameId);
            res.status(200).end();
        });
    }
    else if (req.params.type === 'apn') {
        var hex, i;
        var apnClientId = "";
        for (i=0; i<clientId.length; i++) {
            hex = clientId.charCodeAt(i).toString(16);
            apnClientId += ("000"+hex).slice(-4);
        }
        dbOperations.getAPNClients(function(apnClients) {
            if (apnClients == null) {
                apnClients = {};
            }
            if (!apnClients[gameId]) {
                apnClients[gameId] = [];
            }

            if (apnClients[gameId].indexOf(apnClientId) === -1) {
                apnClients[gameId].push(apnClientId);
            }
            else {
                res.status(400).send("Client is already in list");
            }
            dbOperations.setAPNClients(apnClients);
            console.log("added", apnClientId, "to apn channel", gameId);
            res.status(200).end();
        });
    }
    else {
        res.status(400).send("Invalid notification type");
    }
};

exports.removeClients = function(req, res) {
    var games = req.body.games;
    var clientId = req.body.token;
    var response = [];
    if (req.body.type === 'gcm') {
        dbOperations.getGCMClients(function(gcmClients) {
            if (gcmClients == null) {
                gcmClients = {};
            }
            for (var game in games) {
                var gameId = games[game];
                if (!gcmClients[gameId]) {
                    gcmClients[gameId] = [];
                }

                var clientIndex = gcmClients[gameId].indexOf(clientId);
                if (clientIndex > -1) {
                    gcmClients[gameId].splice(clientIndex, 1);
                    console.log("removed", clientId, "from gcm channel", gameId);
                    response.push({
                        gameId: gameId,
                        status: 200
                    });
                }
                else {
                    response.push({
                        gameId: gameId,
                        status: 400,
                        message: "Client is not in list"
                    });
                }
            }
            dbOperations.setGCMClients(gcmClients);
        });

    }
    else if (req.body.type === 'apn') {
        var hex, i;
        var apnClientId = "";
        for (i=0; i<clientId.length; i++) {
            hex = clientId.charCodeAt(i).toString(16);
            apnClientId += ("000"+hex).slice(-4);
        }
        dbOperations.getAPNClients(function(apnClients) {
            if (apnClients == null) {
                apnClients = {};
            }
            for (var game in games) {
                var gameId = games[game];
                if (!apnClients[gameId]) {
                    apnClients[gameId] = [];
                }

                var clientIndex = apnClients[gameId].indexOf(apnClientId);
                if (clientIndex > -1) {
                    apnClients[gameId].splice(clientIndex, 1);
                    console.log("removed", apnClientId, "from apn channel", gameId);
                    response.push({
                        gameId: gameId,
                        status: 200
                    });
                }
                else {
                    response.push({
                        gameId: gameId,
                        status: 400,
                        message: "Client is not in list"
                    });
                }
            }
            dbOperations.setAPNClients(apnClients);
        });

    }
    else {
        res.status(400).send("Invalid notification type");
    }

    res.status(200).send(response);
}

exports.removeClient = function(req, res) {
    
    var gameId = req.params.id;
    var clientId = req.params.token;
    if (req.params.type === 'gcm') {
        dbOperations.getGCMClients(function(gcmClients) {
            if (gcmClients == null) {
                res.status(500).send("failed to get gcm clients");
            }

            var clientIndex = gcmClients[gameId].indexOf(clientId);
            if (clientIndex > -1) {
                gcmClients[gameId].splice(clientIndex, 1);
            }
            else {
                res.status(400).send("Client is not in list");
            }

            dbOperations.setGCMClients(gcmClients);
            console.log("removed", clientId, "from gcm channel", gameId);
            res.status(200).end();
        });
    }
    else if (req.params.type === 'apn') {
        var hex, i;
        var apnClientId = "";
        for (i=0; i<clientId.length; i++) {
            hex = clientId.charCodeAt(i).toString(16);
            apnClientId += ("000"+hex).slice(-4);
        }
        dbOperations.getAPNClients(function(apnClients) {
            if (apnClients == null) {
                res.status(500).send("failed to get apn clients");
            }

            var clientIndex = apnClients[gameId].indexOf(apnClientId);
            if (clientIndex > -1) {
                apnClients[gameId].splice(clientIndex, 1);
            }
            else {
                res.status(400).send("Client is not in list");
            }

            dbOperations.setAPNClients(apnClients);
            console.log("removed", apnClientId, "from apn channel", gameId);
            res.status(200).end();
        });
    }
    else {
        res.status(400).send("Invalid notification type");
    }
};

exports.deleteClientsFromGame = function(gameId) {
    dbOperations.getGCMClients(function(gcmClients) {
        if (gcmClients != null) {

            delete gcmClients[gameId];

            dbOperations.setGCMClients(gcmClients);
            console.log("removed gcm channel", gameId);
        }
    });

    dbOperations.getAPNClients(function(apnClients) {
        if (apnClients != null) {

            delete apnClients[gameId];

            dbOperations.setAPNClients(apnClients);
            console.log("removed apn channel", gameId);
        }
    });
};

exports.sendGcm = function(gcmMessage) {
    dbOperations.getGCMClients(function(gcmClients) {
        var gameId = gcmMessage.data.gameId || gcmMessage.data.bidEntity.gameId;
        if (gcmClients == null || !gcmClients[gameId]) {
            console.log("no gcm clients on channel");
            return;
        }
        var queueNumber = Math.ceil(gcmClients[gameId].length / 1000);

        for (var i = 1; i <= queueNumber; i++) {
            var message = new gcm.Message({
                timeToLive: 2,
                data: gcmMessage.data
            });
            var lastIndex = (i * 1000 > gcmClients[gameId].length) ? gcmClients[gameId].length : i * 1000;
            gcmSender.send(message, gcmClients[gameId].slice((i - 1) * 1000, lastIndex), function(err, result) {
                if (err) console.error(err);
            });
        }
    });
};

exports.sendApn = function(apnMessage) {
    dbOperations.getAPNClients(function(apnClients) {
        var gameId = apnMessage.data.gameId || apnMessage.data.bidEntity.gameId;
        if (apnClients == null || !apnClients[gameId]) {
            console.log("no apn clients on channel");
            return;
        }

        async.each(apnClients[gameId], function(apnClient, callback) {
            var device = new apn.Device('<'+apnClient+'>');

            var note = new apn.Notification();

            note.expiry = Math.floor(Date.now() / 1000) + 2; // Expires 5 seconds from now.
            note.alert = "New bets are available";
            note.payload = {
                data: apnMessage.data
            };

            apnConnection.pushNotification(note, device);
            callback();
        });
    });
};
