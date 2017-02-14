"use strict";

var fs = require("fs");
var WebSocketUser = require(__dirname + "/websocketuser");

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