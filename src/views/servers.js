"use strict";

var db = require(__dirname + "/../db");
var hash = require(__dirname + "/../hash");
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
        db.get("servers").set(id, formData).value();
        var serverFolder = __dirname + "/../../servers/" + id;
        if (!fs.existsSync(serverFolder)) fs.mkdirSync(serverFolder, 0o777);

        if (formData.game == "factorio") {
            // create server settings file
            var settingsData = formData.factorio;
            if(!settingsData.rcon_port){
                delete settingsData.rcon_port
                delete settingsData.rcon_password;
            }
            settingsData.tags = settingsData.tags.split(" ");
            settingsData.admins = settingsData.admins.replace(/,[\s]+]/g, "").split(",");
            settingsData.visibility = {
                "public" : settingsData.visibility && settingsData.visibility.indexOf("public") > -1,
                "lan" : settingsData.visibility && settingsData.visibility.indexOf("lan") > -1,
            };
            fs.writeFile(serverFolder+"/server-settings.json", JSON.stringify(settingsData))
        }
        callback(true);
        return;
    }
    callback({"servers": servers});
};
