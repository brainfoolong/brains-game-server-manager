"use strict";

var request = require("request");
var db = require(__dirname + "/db");
var exec = require('child_process').exec;
var fs = require("fs");
var fstools = require(__dirname + "/fstools");
var gameserver = require(__dirname + "/gameserver");
var cache = require(__dirname + "/cache");
var compareVersions = require('compare-versions');

/**
 * Games
 * @type {object}
 */
var games = {};

/**
 * Factorio
 * @type {object}
 */
games.factorio = {};

/**
 * Check all requirements to be able to install factorio
 * Return the string of missing application if any requirement no exist
 * @return {string|boolean}
 */
games.factorio.checkRequirements = function () {
    var settings = db.get("settings").value();
    if (!settings.tar) {
        return "tar"
    }
    if (!settings.unzip) {
        return "unzip"
    }
    return true;
};

/**
 * Start server
 * @param {string} id
 * @param {function} callback
 */
games.factorio.startServer = function (id, callback) {

};

/**
 * Stop server
 * @param {string} id
 * @param {function} callback
 */
games.factorio.stopServer = function (id, callback) {
    callback();
};

/**
 * Update server to latest available version
 * @param {string} id
 * @param {function} callback
 */
games.factorio.updateServer = function (id, callback) {
    var settings = db.get("settings").value();
    var serverData = db.get("servers").value()[id];
    gameserver.writeToConsole(id, "Server update started", "info");
    games.factorio.getInstalledVersion(id, function (installedVersion) {
        if (installedVersion === false) {
            return;
        }
        games.factorio.getLatestVersion(serverData.factorio.branch, function (version) {
            games.factorio.getDownloadLink(version, function (url) {
                var lastLength = 0;
                games.factorio.stopServer(id, function () {
                    var tmpFolder = gameserver.getFolder(id) + "/tmp";
                    var packageFile = tmpFolder + "/package.tar.gz";
                    var length = 0;
                    fstools.deleteRecursive(tmpFolder);
                    fs.mkdirSync(tmpFolder, 0o777);
                    gameserver.writeToConsole(id, "Download for server update " + url + " started");
                    request(url, function () {
                        gameserver.writeToConsole(id, "Package downloaded successfully", "info");
                        gameserver.writeToConsole(id, "Unpacking package");
                        exec("cd " + tmpFolder + " && " + settings.tar + " xfv " + packageFile, null, function (error, stdout) {
                            if (error) {
                                gameserver.writeToConsole(id, "Error while unpacking package: " + error, "error");
                                return;
                            }
                            var serverFolder = gameserver.getFolder(id) + "/factorio";
                            if (!fs.existsSync(serverFolder)) fs.mkdirSync(serverFolder, 0o777);
                            exec("cd " + tmpFolder + "/factorio && cp -Rf * " + serverFolder, null, function (error, stdout) {
                                if (error) {
                                    gameserver.writeToConsole(id, "Error while copying new server files: " + error, "error");
                                    return;
                                }
                                fstools.deleteRecursive(tmpFolder);
                                gameserver.writeToConsole(id, "Server update done. You can now start the server", "success");
                                if (callback) callback(true);
                            });
                        });
                    }).on("data", function (chunk) {
                        length += chunk.length;
                        var lengthMB = length / 1024 / 1024;
                        if (lastLength + 5 < lengthMB) {
                            lastLength = lengthMB;
                            gameserver.writeToConsole(id, (lastLength).toFixed(2) + "MB received...");
                        }
                    }).pipe(fs.createWriteStream(packageFile));
                });
            });
        });
    });
};

/**
 * Get available versions
 * @param {function} callback
 */
games.factorio.getAvailableVersions = function (callback) {
    var versions = cache.get("factorio.versions");
    if (versions) {
        callback(versions);
        return;
    }
    request("https://updater.factorio.com/get-available-versions", function (error, response, body) {
        if (error) {
            callback(null);
            return;
        }
        var data = JSON.parse(body);
        cache.set("factorio.versions", data["core-linux_headless64"], 300);
        callback(data["core-linux_headless64"]);
    });
};

/**
 * Get stable version of the factorio server
 * @param {string} branch
 * @param {function} callback
 */
games.factorio.getLatestVersion = function (branch, callback) {
    games.factorio.getAvailableVersions(function (versions) {
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
        callback(maxVersion);
    });
};

/**
 * Get currently installed version of the factorio server
 * @param {string} id
 * @param {function} callback
 */
games.factorio.getInstalledVersion = function (id, callback) {
    var bin = gameserver.getFolder(id) + "/factorio/bin/x64/factorio";
    if (fs.existsSync(bin)) {
        exec(bin + " --version", null, function (error, stdout) {
            if (error) {
                gameserver.writeToConsole(id, "Error getting current factorio server version: " + error, "error");
                callback(false);
                return;
            }
            callback(stdout.match(/Version:([ 0-9\.\-a-z_]+)/i)[1].trim());
        });
        return;
    }
    callback(null);
};

/**
 * Get download link
 * @param {string} version
 * @param {function} callback
 */
games.factorio.getDownloadLink = function (version, callback) {
    request({
        "url": "https://www.factorio.com/get-download/" + version + "/headless/linux64",
        "followRedirect": false
    }, function (error, response, body) {
        if (error) {
            callback(null);
            return;
        }
        callback(body.match(/href="(.*?)"/i)[1].replace(/\&amp;/g, "&"));
    });
};

module.exports = games;