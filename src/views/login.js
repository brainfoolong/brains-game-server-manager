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
    if (frontendMessage && frontendMessage.action == "login") {
        var formData = frontendMessage.formData;
        if (formData.username && formData.password) {
            var pwHash = hash.saltedMd5(formData.password);
            var userData = db.get("users").find({
                "username": formData.username,
                "passwordHash": pwHash
            }).cloneDeep().value();
            if (userData) {
                callback({"userData": userData});
                return;
            }
        }
        callback({"note": {"message": "login.failed", "type": "danger"}, "redirect": "login"});
        return;
    }
    callback();
};