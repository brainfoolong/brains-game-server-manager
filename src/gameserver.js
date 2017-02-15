"use strict";

var fs = require("fs");
var WebSocketUser = require(__dirname + "/websocketuser");
var exec = require('child_process').exec;
var fstools = require(__dirname + "/fstools");
var db = require(__dirname + "/db");

/**
 * Gameserver helper stuff
 * @type {object}
 */
var gameserver = {};

/**
 * Load server backup
 * @param {string} id
 * @param {string} file
 * @param {function=} callback
 */
gameserver.loadServerBackup = function (id, file, callback) {
    var servers = db.get("servers").value();
    var server = servers[id];
    var games = require(__dirname + "/games");
    games[server.game].stopServer(id, function () {
        var backupFile = gameserver.getFolder(id) + "/../backups/" + file;
        if (fs.existsSync(backupFile)) {
            var serverFolder = gameserver.getFolder(id);
            var settings = db.get("settings").value();
            fstools.deleteRecursive(serverFolder);
            fs.mkdirSync(serverFolder, {"mode": 0o777});
            gameserver.writeToConsole(id, "Server backup import started", "info");
            gameserver.writeToConsole(id, "Delete all current server files");
            gameserver.writeToConsole(id, "Unpack all backup files");
            exec("cd " + serverFolder + " && " + settings.tar + " -xf '" + backupFile + "'", null, function (error) {
                if (error) {
                    gameserver.writeToConsole(id, "Error while backup server files: " + error, "error");
                    if (callback) callback(false);
                    return;
                }
                gameserver.writeToConsole(id, "Server backup import done.", "success");
                if (callback) callback(true);
            });
        }
    });
};

/**
 * Create server backup
 * @param {string} id
 * @param {function=} callback
 */
gameserver.createServerBackup = function (id, callback) {
    var serverFolder = gameserver.getFolder(id);
    var backupsFolder = serverFolder + "/../backups";
    var backupFile = backupsFolder + "/" + new Date().toISOString() + ".tar";
    var settings = db.get("settings").value();
    gameserver.writeToConsole(id, "Server backup started. Backupfile: " + backupFile, "info");
    exec("cd " + serverFolder + " && " + settings.tar + " -zcf '" + backupFile + "' .", null, function (error) {
        if (error) {
            gameserver.writeToConsole(id, "Error while backup server files: " + error, "error");
            if (callback) callback(false);
            return;
        }
        gameserver.writeToConsole(id, "Server backup done.", "success");
        if (callback) callback(true);
    });
};

/**
 * Get folder to a game server
 * @type {string}
 * @returns {string}
 */
gameserver.getFolder = function (id) {
    return __dirname + "/../servers/" + id + "/server";
};

/**
 * Append to console logfile
 * @param {string} id
 * @param {string} message
 * @param {string=} type
 */
gameserver.writeToConsole = function (id, message, type) {
    var path = gameserver.getFolder(id) + "/console.log";
    var data = fs.existsSync(path) ? fs.readFileSync(path).toString() : "";
    var lines = data.split("\n");
    lines = lines.splice(-200);
    var messageData = {
        "time": new Date(),
        "type": type || "debug",
        "message": message
    };
    lines.push(JSON.stringify(messageData));
    fs.writeFileSync(path, lines.join("\n"), {"mode": 0o777});

    for (var j = 0; j < WebSocketUser.instances.length; j++) {
        var user = WebSocketUser.instances[j];
        user.send("console-tail", {"server": id, "data": messageData});
    }
};

module.exports = gameserver;