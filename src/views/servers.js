"use strict";

var db = require(__dirname + "/../db");
var hash = require(__dirname + "/../hash");
var gameserver = require(__dirname + "/../gameserver");
var games = require(__dirname + "/../games");
var fs = require("fs");

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} frontendMessage
 * @param {function} callback
 */
module.exports = function (user, frontendMessage, callback) {
    var servers = db.get("servers").value();
    if (!user.userData.admin) {
        callback({"accessdenied": true});
        return;
    }
    if (frontendMessage && frontendMessage.action == "save") {
        var formData = frontendMessage.formData;
        var id = frontendMessage.id || hash.random(32);
        formData.id = id;
        db.get("servers").set(id, formData).value();
        var serverFolder = gameserver.getFolder(id);
        if (!fs.existsSync(serverFolder)) fs.mkdirSync(serverFolder, 0o777);
        games[formData.game].createConfig(id);
        callback(true);
        return;
    }
    callback({"servers": servers});
};
