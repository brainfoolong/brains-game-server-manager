"use strict";

var request = require("request");
var db = require(__dirname + "/../db");
var exec = require('child_process').exec;
var fs = require("fs");
var fstools = require(__dirname + "/../fstools");
var gameserver = require(__dirname + "/../gameserver");
var cache = require(__dirname + "/../cache");
var compareVersions = require('compare-versions');

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
    var servers = db.get("servers").value();
    var server = servers[serverId];
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
 * Get status for given server, will return 'running' or 'stopped'
 * @param {string} id
 * @param {function} callback
 */
rust.getStatus = function (id, callback) {
    exec(gameserver.getFolder(id) + "/server.sh status", function (error, stdout) {
        var status = {
            "status": stdout.trim()
        };
        callback(status);
    });
};

/**
 * Check all requirements to be able to install and use factorio
 * Return note object if anything gone wrong
 * @param {string} id
 * @return {object|boolean}
 */
rust.checkRequirements = function (id) {
    var server = db.get("servers").get(id).value();
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
    var server = db.get("servers").get(id).cloneDeep().value();
    var serverFolder = gameserver.getFolder(id);
    var rustFolder = serverFolder + "/rust";
    if (!fs.existsSync(serverFolder)) fs.mkdirSync(serverFolder, {"mode": 0o777});
    if (!fs.existsSync(rustFolder)) fs.mkdirSync(rustFolder, {"mode": 0o777});

    // create rust.update file
    var template = __dirname + "/rust.update";
    var templateData = fs.readFileSync(template).toString();
    var version = "";
    if (server.rust.branch == "prerelease") version = "-beta prerelease";
    var params = {
        "app": "258550 " + version,
        "folder": rustFolder
    };
    for (var i in params) {
        templateData = templateData.replace(new RegExp("{_" + i + "_}", "i"), params[i]);
    }
    fs.writeFile(serverFolder + "/server.update", templateData, {"mode": 0o777});

    // create rust.sh file
    template = __dirname + "/rust.sh";
    templateData = fs.readFileSync(template).toString();
    var params = {
        "port": server.rust.port,
        "rconweb": server.rust.rcon_web ? 1 : 0,
        "rconport": server.rust.rcon_port,
        "rconpassword": server.rust.rcon_password,
        "id": server.rust.id
    };
    for (var i in params) {
        templateData = templateData.replace(new RegExp("{_" + i + "_}", "i"), params[i]);
    }
    fs.writeFile(serverFolder + "/server.sh", templateData, {"mode": 0o777});
};

/**
 * Update server to latest available version
 * @param {string} id
 * @param {function=} callback
 */
rust.updateServer = function (id, callback) {
    var settings = db.get("settings").value();
    var serverData = db.get("servers").value()[id];
    var serverFolder = gameserver.getFolder(id);
    gameserver.writeToConsole(id, "console.rust.updateServer.1", "info");
    exec(settings.steamcmd + " +runscript " + serverFolder + "/server.update > " + serverFolder + "/steamcmd.log", function (error, stdout) {
        if(error){
            gameserver.writeToConsole(id, ["console.rust.updateServer.error.1", {"error" : JSON.stringify(error)}], "error");
            return;
        }
        gameserver.writeToConsole(id, "console.rust.updateServer.success.1", "info");
    });
};

/**
 * Get available versions
 * @param {function} callback
 */
rust.getAvailableVersions = function (callback) {
    callback(null);
    return;
    var versions = cache.get("rust.versions");
    if (versions) {
        callback(versions);
        return;
    }
    request("https://updater.rust.com/get-available-versions", function (error, response, body) {
        if (error) {
            callback(null);
            return;
        }
        var data = JSON.parse(body);
        cache.set("rust.versions", data["core-linux_headless64"], 300);
        callback(data["core-linux_headless64"]);
    });
};

/**
 * Get stable version of the rust server
 * @param {string} id
 * @param {string} branch
 * @param {function} callback
 */
rust.getLatestVersion = function (id, branch, callback) {
    callback(null);
    return;
    gameserver.writeToConsole(id, "console.getLatestVersion.1");
    rust.getAvailableVersions(function (versions) {
        var maxVersion = '0.0.0';
        for (var i = 0; i < versions.length; i++) {
            var obj = versions[i];
            if (branch == "stable" && obj.stable) {
                maxVersion = obj.stable;
                break;
            }
            if (obj.to && compareVersions(obj.to, maxVersion) === 1) {
                maxVersion = obj.to;
            }
        }
        gameserver.writeToConsole(id, ["console.getLatestVersion.2", {"version": maxVersion}]);
        callback(maxVersion);
    });
};

/**
 * Get currently installed version of the rust server
 * @param {string} id
 * @param {function} callback
 */
rust.getInstalledVersion = function (id, callback) {
    callback(null);
    return;
    gameserver.writeToConsole(id, "console.getInstalledVersion.1");
    callback(null);
    return;
    rust.exec(id, "--version", function (error, stdout) {
        if (error) {
            gameserver.writeToConsole(id, ["console.getInstalledVersion.error.1", {"error": JSON.stringify(error)}], "error");
            callback(null);
            return;
        }
        var version = stdout.match(/Version:([ 0-9\.\-a-z_]+)/i)[1].trim();
        gameserver.writeToConsole(id, ["console.getInstalledVersion.2", {"version": version}]);
        callback(version);
    });
};

/**
 * Get download link
 * @param {string} id
 * @param {string} version
 * @param {function} callback
 */
rust.getDownloadLink = function (id, version, callback) {
    callback(null);
    return;
    gameserver.writeToConsole(id, ["console.rust.getDownloadLink.1", {"version": version}]);
    request({
        "url": "https://www.rust.com/get-download/" + version + "/headless/linux64",
        "followRedirect": false
    }, function (error, response, body) {
        if (error) {
            callback(null);
            return;
        }
        var url = body.match(/href="(.*?)"/i)[1].replace(/\&amp;/g, "&");
        gameserver.writeToConsole(id, ["console.rust.getDownloadLink.2", {"url": url}]);
        callback(url);
    });
};

module.exports = rust;