"use strict";

var fs = require("fs");

/**
 * Gameserver helper stuff
 * @type {object}
 */
var gameserver = {};

/**
 * Get folder to a game server
 * @type {string}
 * @returns {string}
 */
gameserver.getFolder = function (id) {
    return __dirname + "/../servers/" + id;
};

/**
 * Append to console logfile
 * @param {string} id
 * @param {string} message
 * @param {string=} type
 */
gameserver.writeToConsole = function (id, message, type) {
    var path = gameserver.getFolder(id) + "/console.log";
    fs.appendFile(path, JSON.stringify({"time": new Date(), "type": type || "debug", "message": message}) + "\n", {"mode": 0o777});
};

module.exports = gameserver;