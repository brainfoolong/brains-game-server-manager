"use strict";

var fs = require("fs");
var db = require(__dirname + "/../db");
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
        serverlist[i] = servers[i].name;
    }
    var game = null;
    var server = null;
    var serverFolder = null;
    if (frontendMessage) {
        if (frontendMessage.id) {
            if (!servers[frontendMessage.id]) {
                callback();
                return;
            }
            server = servers[frontendMessage.id];
            serverFolder = gameserver.getFolder(frontendMessage.id);
            game = gameserver.getGame(server.game);
        }
        switch (frontendMessage.action) {
            case "updateServer":
                var check = game.checkRequirements()
                if (check === true) {
                    game.updateServer(frontendMessage.id, function (success) {
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
                game.stopServer(frontendMessage.id);
                callback({"note": {"message": "index.stop-server.scheduled", "type": "info", "delay": 20000}});
                break;
            case "pipeCommand":
                if (typeof game.pipeCommand == "function") {
                    game.getStatus(frontendMessage.id, function (status) {
                        if (status.status == "running") {
                            callback({"note": {"message": "index.pipeCommand.sent", "type": "info"}});
                            return;
                        }
                        callback({"note": {"message": "index.pipeCommand.notrunning", "type": "danger"}});
                    });
                    game.pipeCommand(frontendMessage.id, frontendMessage.command);
                    return;
                }
                callback({"note": {"message": "index.pipeCommand.notavailable", "type": "danger"}});
                break;
            case "startServer":
                game.startServer(frontendMessage.id);
                callback({"note": {"message": "index.start-server.scheduled", "type": "info", "delay": 20000}});
                break;
            case "createServerBackup":
                game.createServerBackup(frontendMessage.id);
                callback({"note": {"message": "index.backup.scheduled", "type": "info", "delay": 20000}});
                break;
            case "loadServerBackup":
                game.loadServerBackup(frontendMessage.id, frontendMessage.file);
                callback({"note": {"message": "index.backup.load.scheduled", "type": "info", "delay": 20000}});
                break;
            case "deleteServerBackup":
                var file = serverFolder + "/../backups/" + frontendMessage.file;
                if (fs.existsSync(file)) fs.unlinkSync(file);
                callback({"note": {"message": "index.backup.deleted", "type": "success", "delay": 20000}});
                break;
            case "getServerStatus":
                game.getStatus(frontendMessage.id, function (status) {
                    callback(status);
                });
                break;
            case "getInstalledVersion":
                game.getInstalledVersion(frontendMessage.id, function (version) {
                    callback(version);
                });
                break;
            case "getLatestVersion":
                game.getLatestVersion(frontendMessage.id, server.branch, function (version) {
                    callback(version);
                });
                break;
            case "getFilelist":
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
                break;
            case "getBackups":
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
                var path = serverFolder + "/" + frontendMessage.file + ".log";
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
                callback({
                    "serverData": server
                });
                break;
            default:
                game.onCustomFrontendMessage(frontendMessage.id, frontendMessage, callback);
        }
        return;
    }
    callback({"serverlist": serverlist});
};