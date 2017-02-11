"use strict";

var db = require(__dirname + "/../db");
var hash = require(__dirname + "/../hash");

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} frontendMessage
 * @param {function} callback
 */
module.exports = function (user, frontendMessage, callback) {
    var users = db.get("users").cloneDeep().value();
    var usersCount = db.get("users").size().value();
    if (usersCount && (!user.userData || !user.userData.admin)) {
        callback({"accessdenied": true});
        return;
    }
    if (frontendMessage && frontendMessage.action == "save") {
        var formData = frontendMessage.formData;
        var id = frontendMessage.id || hash.random(32);
        var hasAdmin = formData.admin;
        if (!hasAdmin) {
            for (var userId in users) {
                if (userId != id && users.hasOwnProperty(userId)) {
                    if (users[userId].admin) {
                        hasAdmin = true;
                        break;
                    }
                }
            }
        }
        if (!hasAdmin) {
            callback({"note": {"message": "users.missing.admin", "type": "danger"}});
            return;
        }
        if ((!frontendMessage.id && !formData.password) || (formData.password != formData.password2)) {
            callback({"note": {"message": "users.error.pwmatch", "type": "danger"}});
            return;
        }
        var userData = users[id] || formData;
        if (formData.password) {
            userData.passwordHash = hash.saltedMd5(formData.password);
        }
        delete userData["password"];
        delete userData["password2"];
        userData.loginHash = hash.random(64);
        db.get("users").set(id, userData).value();
        callback(true);
        return;
    }
    callback({"users": users});
};