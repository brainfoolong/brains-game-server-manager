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
            case "pipeCommand":
                var server = servers[frontendMessage.id];
                if (typeof games[server.game].pipeCommand == "function") {
                    games[server.game].getStatus(frontendMessage.id, function (status) {
                        if (status.status == "running") {
                            callback({"note": {"message": "index.pipeCommand.sent", "type": "info"}});
                            return;
                        }
                        callback({"note": {"message": "index.pipeCommand.notrunning", "type": "danger"}});
                    });
                    games[server.game].pipeCommand(frontendMessage.id, frontendMessage.command);
                    return;
                }
                callback({"note": {"message": "index.pipeCommand.notavailable", "type": "danger"}});
                break;
            case "startServer":
                var server = servers[frontendMessage.id];
                games[server.game].startServer(frontendMessage.id);
                callback({"note": {"message": "index.start-server.scheduled", "type": "info", "delay": 20000}});
                break;
            case "createServerBackup":
                gameserver.createServerBackup(frontendMessage.id);
                callback({"note": {"message": "index.backup.scheduled", "type": "info", "delay": 20000}});
                break;
            case "loadServerBackup":
                gameserver.loadServerBackup(frontendMessage.id, frontendMessage.file);
                callback({"note": {"message": "index.backup.load.scheduled", "type": "info", "delay": 20000}});
                break;
            case "deleteServerBackup":
                var file = gameserver.getFolder(frontendMessage.id) + "/../backups/" + frontendMessage.file;
                if (fs.existsSync(file)) fs.unlinkSync(file);
                callback({"note": {"message": "index.backup.deleted", "type": "success", "delay": 20000}});
                break;
            case "getServerStatus":
                var server = servers[frontendMessage.id];
                if (server) {
                    games[server.game].getStatus(frontendMessage.id, function (status) {
                        callback(status);
                    });
                    return;
                }
                callback();
                break;
            case "getInstalledVersion":
                var server = servers[frontendMessage.id];
                games[server.game].getInstalledVersion(frontendMessage.id, function (version) {
                    callback(version);
                });
                break;
            case "getLatestVersion":
                var server = servers[frontendMessage.id];
                games[server.game].getLatestVersion(frontendMessage.id, server.branch, function (version) {
                    callback(version);
                });
                break;
            case "getFilelist":
                var server = servers[frontendMessage.id];
                if (server) {
                    var serverFolder = gameserver.getFolder(frontendMessage.id);
                    var folder = serverFolder + "/" + server.game + frontendMessage.folder;
                    var arr = [];
                    if (fs.existsSync(folder)) {
                        var files = fs.readFileSync(folder);
                        for (var i = 0; i < files.length; i++) {
                            var file = files[i];
                            var stat = fs.statSync(folder + "/" + file);
                            arr.push({"name": file, "size": stat.size});
                        }
                    }
                    callback(arr);
                    return;
                }
                callback();
                break;
            case "getBackups":
                var serverFolder = gameserver.getFolder(frontendMessage.id);
                var files = fs.readdirSync(serverFolder + "/../backups");
                var arr = [];
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    var stat = fs.statSync(serverFolder + "/../backups/" + file);
                    arr.push({"name": file, "size": stat.size});
                }
                callback(arr);
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
                    return;
                }
                callback("empty");
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