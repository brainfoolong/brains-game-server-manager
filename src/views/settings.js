"use strict";

var db = require(__dirname + "/../db");
var hash = require(__dirname + "/../hash");
var exec = require('child_process').exec;

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} frontendMessage
 * @param {function} callback
 */
module.exports = function (user, frontendMessage, callback) {
    exec("which steamcmd", null, function (error, stdout, stderr) {
        var settings = db.get("settings").value();
        var steamcmdDefault = !error ? stdout.toString().trim() : null;
        if (frontendMessage && frontendMessage.action == "save") {
            var formData = frontendMessage.formData;
            settings.steamcmd = formData.steamcmd || steamcmdDefault || null;
            console.log(formData, steamcmdDefault, settings);
            db.get("settings").setState(settings);
            callback(true);
            return;
        }
        callback({
            "steamcmd": settings.steamcmd,
            "steamcmdDefault": steamcmdDefault
        });
    });
};
