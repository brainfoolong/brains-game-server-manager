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
    if (!user.userData.admin) {
        callback({"accessdenied": true});
        return;
    }
    var settings = db.get("settings").value();
    exec("which steamcmd", null, function (error, stdout) {
        var steamcmdDefault = !error ? stdout.toString().trim() : null;
        exec("which tar", null, function (error, stdout) {
            var tarDefault = !error ? stdout.toString().trim() : null;
            exec("which unzip", null, function (error, stdout) {
                var unzipDefault = !error ? stdout.toString().trim() : null;
                if (frontendMessage && frontendMessage.action == "save") {
                    var formData = frontendMessage.formData;
                    settings.steamcmd = formData.steamcmd || steamcmdDefault || null;
                    settings.unzip = formData.unzip || unzipDefault || null;
                    settings.tar = formData.tar || tarDefault || null;
                    db.get("settings").setState(settings);
                    callback(true);
                    return;
                }
                callback({
                    "steamcmd": settings.steamcmd,
                    "steamcmdDefault": steamcmdDefault,
                    "tar": settings.tar,
                    "tarDefault": tarDefault,
                    "unzip": settings.unzip,
                    "unzipDefault": unzipDefault
                });
            });
        });
    });
};
