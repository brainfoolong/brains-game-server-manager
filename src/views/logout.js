"use strict";

/**
 * The view
 * @param {WebSocketUser} user
 * @param {object} frontendMessage
 * @param {function} callback
 */
module.exports = function (user, frontendMessage, callback) {
    user.userData = null;
    callback({"note": {"message": "logout.success", "type": "success"}});
};