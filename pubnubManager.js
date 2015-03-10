var instanceName = "server_" + process.env.DYNO;
var pubnub = require("pubnub").init({
    publish_key: process.env.PUBNUB_PUBLISH_KEY,
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY,
    uuid: instanceName,
    heartbeat: 20
});
var gameController = require('./game');
var bidController = require('./bid');
var mobileManager = require('./mobileManager');



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
            if (m.lb_gcm || m.bidRequest.lb_gcm) {
                mobileManager.sendGcm(m.lb_gcm || m.bidRequest.lb_gcm);
            }
            if (m.lb_apn || m.bidRequest.lb_apn) {
                mobileManager.sendApn(m.lb_apn || m.bidRequest.lb_apn);
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

