"use strict";

var fs = require("fs");
var db = require(__dirname + "/../db");
var games = require(__dirname + "/../games");
var gameserver = require(__dirname + "/../gameserver");
var fstools = require(__dirname + "/../fstools");
var WebSocketUser = require(__dirname + "/../websocketuser");

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
                    games[server.game].updateServer(frontendMessage.id, function (success) {
                        callback(success);
                    });
                } else {
                    callback({
                        "note": {
                            "message": ["missing.requirements", {"app": check}],
                            "type": "danger",
                            "delay": 20000
                        }
                    });
                }
                break;
            case "stopServer":
                var server = servers[frontendMessage.id];
                games[server.game].stopServer(frontendMessage.id);
                callback({"note": {"message": "index.stop-server.scheduled", "type": "info", "delay": 20000}});
                break;
            case "startServer":
                var server = servers[frontendMessage.id];
                games[server.game].startServer(frontendMessage.id);
                callback({"note": {"message": "index.start-server.scheduled", "type": "info", "delay": 20000}});
                break;
            case "getServerStatus":
                var server = servers[frontendMessage.id];
                games[server.game].getStatus(frontendMessage.id, function (status) {
                    callback(status);
                });
                break;
            case "getVersions":
                var server = servers[frontendMessage.id];
                games[server.game].getLatestVersion(frontendMessage.id, server.branch, function (stableVersion) {
                    games[server.game].getInstalledVersion(frontendMessage.id, function (installedVersion) {
                        callback({
                            "available": stableVersion,
                            "installed": installedVersion
                        });
                    });
                });
                break;
            case "loadLog":
                var path = gameserver.getFolder(frontendMessage.id) + "/" + frontendMessage.file + ".log";
                if (fs.existsSync(path)) {
                    callback(fs.readFileSync(path).toString());
                    if (frontendMessage.file != "console") {
                        fstools.tailFile(path, function (data) {
                            for (var j = 0; j < WebSocketUser.instances.length; j++) {
                                var user = WebSocketUser.instances[j];
                                user.send(frontendMessage.file + "-tail", {
                                    "server": frontendMessage.id,
                                    "data": {"time": new Date(), "message": data, "type": "debug"}
                                });
                            }
                        });
                    }
                }
                break;
            case "load":
                if (typeof servers[frontendMessage.id] == "undefined") {
                    callback();
                    return;
                }
                var server = servers[frontendMessage.id];
                callback({
                    "serverData": server
                });
                break;
            default:
                if (typeof servers[frontendMessage.id] == "undefined") {
                    callback();
                    return;
                }
                var server = servers[frontendMessage.id];
                games[server.game].onCustomFrontendMessage(frontendMessage.id, frontendMessage, callback);
        }
        return;
    }
    callback({"serverlist": serverlist});
};