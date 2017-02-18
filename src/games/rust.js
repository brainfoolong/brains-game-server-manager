"use strict";

var request = require("request");
var db = require(__dirname + "/../db");
var exec = require('child_process').exec;
var fs = require("fs");
var fstools = require(__dirname + "/../fstools");
var gameserver = require(__dirname + "/../gameserver");
var cache = require(__dirname + "/../cache");

/**
 * Rust
 * @type {object}
 */
var rust = {};

/**
 * Receiving a custom message from the frontend dashboard
 * @param {string} serverId
 * @param {object} message
 * @param {function} callback
 */
rust.onCustomFrontendMessage = function (serverId, message, callback) {
    switch (message.action) {
        case "getMaps":

            break;
        case "deleteMap":

            break;
        case "saveMap":

            break;
        default:
            callback();
    }
};

/**
 * Check all requirements to be able to install and use factorio
 * Return note object if anything gone wrong
 * @param {string} id
 * @return {object|boolean}
 */
rust.checkRequirements = function (id) {
    var settings = db.get("settings").value();
    var note = null;
    var noteParams = null;
    if (!settings.steamcmd) {
        note = "missing.requirements";
        noteParams = {"app": "steamcmd"};
    }
    if (!note) {
        return true;
    }
    return {
        "message": [note, noteParams],
        "type": "danger",
        "delay": 20000
    };
};

/**
 * Create required server configuration files
 * @param {string} id
 */
rust.createConfig = function (id) {
    var serverData = gameserver.getData(id);
    var serverFolder = gameserver.getFolder(id);
    var rustFolder = serverFolder + "/rust";
    if (!fs.existsSync(serverFolder)) fs.mkdirSync(serverFolder, {"mode": 0o777});
    if (!fs.existsSync(rustFolder)) fs.mkdirSync(rustFolder, {"mode": 0o777});

    // create server.update file
    var template = __dirname + "/rust.update.txt";
    var templateData = fs.readFileSync(template).toString();
    var version = "";
    if (serverData.rust.branch == "prerelease") version = "-beta prerelease";
    var params = {
        "app": "258550 " + version,
        "folder": rustFolder
    };
    for (var i in params) {
        templateData = templateData.replace(new RegExp("{_" + i + "_}", "i"), params[i]);
    }
    fs.writeFile(serverFolder + "/server.update.txt", templateData, {"mode": 0o777});

    // create server.releaseinfo file
    template = __dirname + "/rust.releaseinfo.txt";
    templateData = fs.readFileSync(template).toString();
    for (var i in params) {
        templateData = templateData.replace(new RegExp("{_" + i + "_}", "i"), params[i]);
    }
    fs.writeFile(serverFolder + "/server.releaseinfo.txt", templateData, {"mode": 0o777});

    // create server.sh file
    template = __dirname + "/rust.sh";
    templateData = fs.readFileSync(template).toString();
    params = {
        "server.port": serverData.rust.port,
        "server.ip": serverData.rust.ip,
        "rcon.web": serverData.rust.rcon_web ? 1 : 0,
        "rcon.ip": serverData.rust.rcon_ip,
        "rcon.port": serverData.rust.rcon_port,
        "rcon.password": serverData.rust.rcon_password,
        "server.identity": serverData.rust.id,
        "server.maxplayers": serverData.rust.maxplayers,
        "server.hostname": serverData.rust.hostname,
        "server.description": serverData.rust.description,
        "server.headerimage": serverData.rust.headerimage,
        "server.url": serverData.rust.url,
        "server.seed": serverData.rust.seed,
        "server.worldsize": serverData.rust.worldsize,
        "server.saveinterval": serverData.rust.saveinterval,
        "server.globalchat": serverData.rust.globalchat ? 1 : 0,
        "server.secure": serverData.rust.secure ? 1 : 0,
        "server.stability": serverData.rust.stability ? 1 : 0
    };
    var paramsStr = "";
    for (var i in params) {
        paramsStr += "+" + i + " \"" + params[i].toString().replace(/\n/g, "\\n").replace(/"/g, "\\\"") + "\" ";
    }
    templateData = templateData.replace(new RegExp("{_params_}", "i"), paramsStr).replace(/\{_id_\}/g, id);
    fs.writeFile(serverFolder + "/server.sh", templateData, {"mode": 0o777});
};

/**
 * Update server to latest available version
 * @param {string} id
 * @param {function=} callback
 */
rust.updateServer = function (id, callback) {
    gameserver.stopServer(id, function () {
        var settings = db.get("settings").value();
        var serverFolder = gameserver.getFolder(id);
        gameserver.writeToConsole(id, "console.rust.updateServer.1", "info");
        exec(settings.steamcmd + " +runscript " + serverFolder + "/server.update.txt > " + serverFolder + "/steamcmd.log", function (error, stdout) {
            if (error) {
                gameserver.writeToConsole(id, ["console.rust.updateServer.error.1", {"error": JSON.stringify(error)}], "error");
                return;
            }
            gameserver.writeToConsole(id, "console.rust.updateServer.success.1", "info");
            callback(true);
        });
    });
};

/**
 * Get stable version of the rust server
 * @param {string} id
 * @param {string} branch
 * @param {function} callback
 */
rust.getLatestVersion = function (id, branch, callback) {
    gameserver.writeToConsole(id, "console.getLatestVersion.1");
    var version = cache.get("rust.releaseinfo");
    if (!version) {
        var settings = db.get("settings").value();
        var serverFolder = gameserver.getFolder(id);
        exec(settings.steamcmd + " +runscript " + serverFolder + "/server.releaseinfo.txt", function (error, stdout) {
            if (error) {
                gameserver.writeToConsole(id, ["console.getLatestVersion.error.1", {"error": JSON.stringify(error)}], "error");
                return;
            }
            var serverData = gameserver.getData(id);
            stdout = stdout.replace(/\s/g, "");
            var regex = '"branches".*?"' + serverData.rust.branch + '".*?"buildid""(.*?)"';
            var match = stdout.match(new RegExp(regex, "i"));
            if (match) {
                version = match[1];
            }
            gameserver.writeToConsole(id, ["console.getLatestVersion.2", {"version": version}]);
            cache.set("rust.releaseinfo", version, 30 * 60);
            callback(version);
        });
    } else {
        gameserver.writeToConsole(id, ["console.getLatestVersion.2", {"version": version}]);
        callback(version);
    }
};

/**
 * Get currently installed version of the rust server
 * @param {string} id
 * @param {function} callback
 */
rust.getInstalledVersion = function (id, callback) {
    gameserver.writeToConsole(id, "console.getInstalledVersion.1");
    var serverFolder = gameserver.getFolder(id);
    var manifest = serverFolder + "/rust/steamapps/appmanifest_258550.acf";
    if (!fs.existsSync(manifest)) {
        gameserver.writeToConsole(id, ["console.getInstalledVersion.error.1", {"error": "Server not installed"}], "error");
        callback(null);
        return;
    }
    var fileData = fs.readFileSync(manifest).toString();
    var match = fileData.match(/"buildid"[\s]+"(.*?)"/);
    var version = match ? match[1] : null;
    callback(version);
    gameserver.writeToConsole(id, ["console.getInstalledVersion.2", {"version": version}]);
};

module.exports = rust;