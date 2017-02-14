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
 * Factorio
 * @type {object}
 */
var factorio = {};

/**
 * Receiving a custom message from the frontend dashboard
 * @param {string} serverId
 * @param {object} message
 * @param {function} callback
 */
factorio.onCustomFrontendMessage = function (serverId, message, callback) {
    var servers = db.get("servers").value();
    var server = servers[serverId];
    switch (message.action) {
        case "getMaps":
            callback(server.factorioMaps);
            break;
        case "deleteMap":
            var noteMessage = "index.factorio.map.deletion-scheduled";
            var noteType = "info";
            if (server.factorio.map == message.map) {
                factorio.stopServer(serverId, function () {
                    factorio.deleteMap(serverId, message.map);
                });
            } else {
                factorio.deleteMap(serverId, message.map);
            }
            delete server.factorioMaps[message.map];
            db.get("servers").set(serverId, server).value();
            callback({"note": {"message": noteMessage, "type": noteType}});
            break;
        case "saveMap":
            if (!server.factorioMaps) {
                server.factorioMaps = {};
            }
            var id = message.map || message.formData.id;
            var noteMessage = "index.factorio.map.saved";
            var noteType = "info";
            if (typeof server.factorioMaps[id] != "undefined" && !message.map) {
                noteMessage = "index.factorio.map.exist";
                noteType = "danger";
            } else {
                server.factorioMaps[id] = message.formData;
                if (message.formData.active) {
                    server.factorio.map = id;
                }
                db.get("servers").set(serverId, server).value();
            }
            // recreate the server config for the new map config
            if (message.formData.active) {
                factorio.createConfig(serverId);
                factorio.createMap(serverId, id, message.formData, function (error, stdout) {

                });
            }
            callback({"note": {"message": noteMessage, "type": noteType}});
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
factorio.getStatus = function (id, callback) {
    exec(gameserver.getFolder(id) + "/server.sh status", function (error, stdout) {
        var status = {
            "status": stdout
        };
        callback(status);
    });
};

/**
 * Execute a server command
 * @param {string} id
 * @param {string} cmd
 * @param {function} callback
 */
factorio.exec = function (id, cmd, callback) {
    var bin = gameserver.getFolder(id) + "/server/bin/x64/factorio";
    if (fs.existsSync(bin)) {
        exec(bin + " " + cmd, null, callback);
        return;
    }
    callback(new Error("Program not found"));
};

/**
 * Create map files
 * @param {string} id
 * @param {string} map
 * @param {object} mapData
 * @param {function} callback
 */
factorio.createMap = function (id, map, mapData, callback) {
    var mapFile = gameserver.getFolder(id) + "/maps/" + map + ".zip";
    if (fs.existsSync(mapFile)) {
        callback(null, null);
        return;
    }
    var settingsFile = gameserver.getFolder(id) + "/map-settings.json";
    fs.writeFileSync(settingsFile, JSON.stringify(mapData), {"mode": 0o777});
    factorio.exec(id, "--create " + mapFile + " --map-gen-settings " + settingsFile, callback);
};

/**
 * Delete map files
 * @param {string} id
 * @param {string} map
 */
factorio.deleteMap = function (id, map) {

};

/**
 * Check all requirements to be able to install factorio
 * Return the string of missing application if any requirement no exist
 * @return {string|boolean}
 */
factorio.checkRequirements = function () {
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
 * Create required server configuration files
 * @param {string} id
 */
factorio.createConfig = function (id) {
    var server = db.get("servers").get(id).cloneDeep().value();
    var serverFolder = gameserver.getFolder(id);

    // create server settings file
    var settingsData = server.factorio;
    if (!settingsData.rcon_port) {
        delete settingsData.rcon_port
        delete settingsData.rcon_password;
    }
    settingsData.tags = settingsData.tags.split(" ");
    settingsData.admins = settingsData.admins.replace(/,[\s]+]/g, "").split(",");
    settingsData.visibility = {
        "public": settingsData.visibility && settingsData.visibility.indexOf("public") > -1,
        "lan": settingsData.visibility && settingsData.visibility.indexOf("lan") > -1,
    };
    fs.writeFile(serverFolder + "/server-settings.json", JSON.stringify(settingsData));

    // create shellscript
    var template = __dirname + "/factorio.sh";
    var templateData = fs.readFileSync(template).toString();
    for (var i in settingsData) {
        if (settingsData.hasOwnProperty(i)) {
            templateData = templateData.replace(new RegExp("{_" + i + "_}", "i"), settingsData[i]);
        }
    }
    fs.writeFile(serverFolder + "/server.sh", templateData);
};

/**
 * Start server
 * @param {string} id
 * @param {function=} callback
 */
factorio.startServer = function (id, callback) {
    var server = db.get("servers").get(id).value();
    gameserver.writeToConsole(id, "Server starting...", "info");
    if (!server.factorio.map) {
        gameserver.writeToConsole(id, "No active map set. Create one.", "error");
        return;
    }
    var bin = gameserver.getFolder(id) + "/server.sh";
    exec(bin + " start", function (error, stdout) {
        gameserver.writeToConsole(id, "Server started with message: " + stdout, "success");
        if (callback) callback(true);
    });
};

/**
 * Stop server
 * @param {string} id
 * @param {function=} callback
 */
factorio.stopServer = function (id, callback) {
    var bin = gameserver.getFolder(id) + "/server.sh";
    gameserver.writeToConsole(id, "Server stopping...", "info");
    exec(bin + " stop", function (error, stdout) {
        gameserver.writeToConsole(id, "Server stopped with message: " + stdout, "success");
        if (callback) callback(true);
    });
};

/**
 * Update server to latest available version
 * @param {string} id
 * @param {function=} callback
 */
factorio.updateServer = function (id, callback) {
    var settings = db.get("settings").value();
    var serverData = db.get("servers").value()[id];
    gameserver.writeToConsole(id, "Server update started", "info");
    factorio.getLatestVersion(id, serverData.factorio.branch, function (version) {
        factorio.getDownloadLink(id, version, function (url) {
            var lastLength = 0;
            factorio.stopServer(id, function () {
                var serverFolder = gameserver.getFolder(id) + "/server";
                var tmpFolder = gameserver.getFolder(id) + "/tmp";
                var packageFile = tmpFolder + "/package.tar.gz";
                var length = 0;
                fstools.deleteRecursive(tmpFolder);
                fs.mkdirSync(tmpFolder, 0o777);
                gameserver.writeToConsole(id, "Download for server update " + url + " started");
                request(url, function () {
                    gameserver.writeToConsole(id, "Package downloaded successfully");
                    gameserver.writeToConsole(id, "Unpacking server to temp directory");
                    exec("cd " + tmpFolder + " && " + settings.tar + " xfv " + packageFile, null, function (error) {
                        if (error) {
                            gameserver.writeToConsole(id, "Error while unpacking package: " + error, "error");
                            if (callback) callback(false);
                            return;
                        }
                        gameserver.writeToConsole(id, "Copy unpacked files to final destination");
                        if (!fs.existsSync(serverFolder)) fs.mkdirSync(serverFolder, 0o777);
                        exec("cd " + tmpFolder + "/factorio && cp -Rf * " + serverFolder, null, function (error) {
                            if (error) {
                                gameserver.writeToConsole(id, "Error while copying new server files: " + error, "error");
                                if (callback) callback(false);
                                return;
                            }
                            fstools.deleteRecursive(tmpFolder);
                            var mapsFolder = serverFolder + "/maps";
                            if (!fs.existsSync(mapsFolder)) fs.mkdirSync(mapsFolder, 0o777);
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
};

/**
 * Get available versions
 * @param {function} callback
 */
factorio.getAvailableVersions = function (callback) {
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
 * @param {string} id
 * @param {string} branch
 * @param {function} callback
 */
factorio.getLatestVersion = function (id, branch, callback) {
    gameserver.writeToConsole(id, "Get latest available version");
    factorio.getAvailableVersions(function (versions) {
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
        gameserver.writeToConsole(id, "Version: " + maxVersion);
        callback(maxVersion);
    });
};

/**
 * Get currently installed version of the factorio server
 * @param {string} id
 * @param {function} callback
 */
factorio.getInstalledVersion = function (id, callback) {
    gameserver.writeToConsole(id, "Get currently installed version");
    factorio.exec(id, "--version", function (error, stdout) {
        if (error) {
            gameserver.writeToConsole(id, "Error getting current factorio server version: " + error, "error");
            callback(null);
            return;
        }
        var version = stdout.match(/Version:([ 0-9\.\-a-z_]+)/i)[1].trim();
        gameserver.writeToConsole(id, "Version: " + version);
        callback(version);
    });
};

/**
 * Get download link
 * @param {string} id
 * @param {string} version
 * @param {function} callback
 */
factorio.getDownloadLink = function (id, version, callback) {
    gameserver.writeToConsole(id, "Get download link to version " + version);
    request({
        "url": "https://www.factorio.com/get-download/" + version + "/headless/linux64",
        "followRedirect": false
    }, function (error, response, body) {
        if (error) {
            callback(null);
            return;
        }
        var url = body.match(/href="(.*?)"/i)[1].replace(/\&amp;/g, "&");
        gameserver.writeToConsole(id, "URL: " + url);
        callback(url);
    });
};

module.exports = factorio;