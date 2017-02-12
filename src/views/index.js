"use strict";

var db = require(__dirname + "/../db");

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} frontendMessage
 * @param {function} callback
 */
module.exports = function (user, frontendMessage, callback) {
    var servers = db.get("servers").value();
    var serverlist = {};
    for (var i in servers) {
        var server = servers[i];
        serverlist[i] = server.name;
    }
    if (frontendMessage) {
        switch (frontendMessage.action) {
            case "load":
                callback(servers[frontendMessage.id]);
                break;
        }
    }
    callback({"serverlist": serverlist});
};