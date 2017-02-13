"use strict";

var db = require(__dirname + "/../db");
var games = require(__dirname + "/../games");

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
            case "updateServer":
                var server = servers[frontendMessage.id];
                var check = games[server.game].checkRequirements()
                if (check === true) {
                    games[server.game].updateServer(frontendMessage.id, function () {

                    });
                    callback({"note": {"message": "index.update-server.scheduled", "type": "info", "delay": 20000}});
                } else {
                    callback({"note": {"message": "missing.requirements", "type": "danger", "delay": 20000}});
                }
                return;
                break;
            case "getVersions":
                games.factorio.getStableVersion(function (stableVersion) {
                    games.factorio.getInstalledVersion(frontendMessage.id, function (installedVersion) {
                        callback({
                            "available": stableVersion,
                            "installed": installedVersion
                        });
                    });
                });
                return;
                break;
            case "load":
                var server = servers[frontendMessage.id];
                callback(server);
                return;
                break;
        }
    }
    callback({"serverlist": serverlist});
};