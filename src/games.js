"use strict";

var request = require("request");
var db = require(__dirname + "/db");
var exec = require('child_process').exec;
var fs = require("fs");
var fstools = require(__dirname + "/fstools");
var gameserver = require(__dirname + "/gameserver");
var cache = require(__dirname + "/cache");
var settings = db.get("settings").value();

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
    gameserver.writeToConsole(id, "Server update started", "info");
    games.factorio.getInstalledVersion(id, function (installedVersion) {
        var downloadPackage = function (url, extension) {
            var lastLength = 0;
            games.factorio.stopServer(id, function () {
                var tmpFolder = gameserver.getFolder(id) + "/tmp";
                var packageFile = tmpFolder + "/package." + extension;
                var length = 0;
                fstools.deleteRecursive(tmpFolder);
                fs.mkdirSync(tmpFolder, 0o777);
                request(url, function () {
                    gameserver.writeToConsole(id, "Package downloaded successfully", "info");
                    gameserver.writeToConsole(id, "Unpacking package");
                }).on("data", function (chunk) {
                    length += chunk.length;
                    if (lastLength + 512 < length / 1024) {
                        lastLength = length / 1024;
                        gameserver.writeToConsole(id, "Download server update " + url + "... " + (lastLength).toFixed(0) + "kB received...");
                    }
                }).pipe(fs.createWriteStream(packageFile));
            });
        };
        if (installedVersion === null) {
            games.factorio.getStableVersion(function (version) {
                games.factorio.getDownloadLink(null, version, function (url) {
                    downloadPackage(url, "tar.gz");
                });
            });
        } else
            games.factorio.getNextVersion(installedVersion, function (version, isStable) {
                games.factorio.getDownloadLink(installedVersion, version, function (url) {
                    downloadPackage(url, "zip");
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
 * @param {function} callback
 */
games.factorio.getStableVersion = function (callback) {
    games.factorio.getAvailableVersions(function (versions) {
        for (var i = 0; i < versions.length; i++) {
            var obj = versions[i];
            if (obj.stable) {
                callback(obj.stable);
            }
        }
    });
};

/**
 * Get next version of the factorio server and a flag if this is the current stable version
 * @param {string} version
 * @param {function} callback
 */
games.factorio.getNextVersion = function (version, callback) {
    games.factorio.getAvailableVersions(function (versions) {
        var next = "";
        var stable = "";
        for (var i = 0; i < versions.length; i++) {
            var obj = versions[i];
            if (obj.from && obj.from == version) {
                next = obj.to;
            }
            if (obj.stable) {
                stable = obj.stable;
            }
        }
        callback(next, next == stable);
    });
};

/**
 * Get currently installed version of the factorio server
 * @param {string} id
 * @param {function} callback
 */
games.factorio.getInstalledVersion = function (id, callback) {
    var bin = gameserver.getFolder(id) + "/server/bin/x64/factorio";
    if (fs.existsSync(bin)) {
        exec(bin + " --version", null, function (error, stdout) {
            console.log(stdout);
        });
        return;
    }
    callback(null);
};

/**
 * Get download link
 * @param {string|null} fromVersion
 * @param {string} toVersion
 * @param {function} callback
 */
games.factorio.getDownloadLink = function (fromVersion, toVersion, callback) {
    if (fromVersion === null) {
        request({
            url: "https://www.factorio.com/get-download/" + toVersion + "/headless/linux64",
            "followRedirect": false
        }, function (error, response, body) {
            if (error) {
                callback(null);
                return;
            }
            callback(body.match(/href="(.*?)"/i)[1].replace(/\&amp;/g, "&"));
        });
    } else {
        request("https://updater.factorio.com/get-download-link?from=" + fromVersion + "&to=" + toVersion + "&apiVersion=2&package=core-linux_headless64", function (error, response, body) {
            if (error) {
                callback(null);
                return;
            }
            var data = JSON.parse(body);
            callback(data[0]);
        });
    }
};

module.exports = games;