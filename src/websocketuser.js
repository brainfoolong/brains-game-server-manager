"use strict";

var db = require(__dirname + "/db");
var fs = require("fs");
var hash = require(__dirname + "/hash");

/**
 * A single websocket user
 * @constructor
 */
function WebSocketUser(socket) {
    /** @type {WebSocketUser} */
    var self = this;
    /** @type {number|null} */
    this.id = null;
    /** @type {WebSocket} */
    this.socket = socket;
    /**
     * The current stored userdata
     * Updated with each websocket incoming message
     * @type {null}
     */
    this.userData = null;

    /**
     * Send message to client
     * @param {string} action
     * @param {object=} message
     * @param {number=} callbackId
     */
    this.send = function (action, message, callbackId) {
        if (self.socket) {
            if (typeof message == "undefined") {
                message = null;
            }
            var data = {
                "action": action,
                "message": message
            };
            if (typeof callbackId == "number") {
                data.callbackId = callbackId;
            }
            self.socket.send(JSON.stringify(data));
        }
    };

    /**
     * On receive message from socket
     * @param {object} frontendMessage
     */
    this.onMessage = function (frontendMessage) {
        // just send a message to the user for the callback in the frontend
        var sendCallback = function (message) {
            self.send(frontendMessage.action, message, frontendMessage.callbackId);
        };
        try {
            var message = frontendMessage.message;
            switch (frontendMessage.action) {
                case "view":
                    var view = message.view;
                    if (!db.get("users").size().value()) {
                        // if no user exist, force user admin panel
                        view = "users";
                    } else if (self.userData === null) {
                        // if not logged in, force login page
                        view = "login";
                    }
                    if (view != message.view) {
                        sendCallback({"redirect": view});
                    } else {
                        if (fs.existsSync(__dirname + "/views/" + message.view + ".js")) {
                            require(__dirname + "/views/" + message.view)(self, message.message, sendCallback);
                        } else {
                            sendCallback({
                                "note": {
                                    "message": "View '" + message.view + "' not exist",
                                    "type": "danger"
                                }
                            });
                        }
                    }
                    break;
                case "closed":
                    WebSocketUser.instances.splice(self.id, 1);
                    self.socket = null;
                    self.userData = null;
                    break;
                case "init":
                    var userData = db.get("users").find({
                        "username": frontendMessage.loginName,
                        "loginHash": frontendMessage.loginHash
                    }).cloneDeep().value();
                    self.userData = null;
                    if (userData) {
                        delete userData["password"];
                        self.userData = userData;
                        // add instance of this is a complete new user
                        if (self.id === null) {
                            self.id = WebSocketUser.instances.length;
                            WebSocketUser.instances.push(self);
                        }
                    }
                    sendCallback({
                        "userData": userData,
                        "package": require(__dirname + "/../package"),
                        "latestVersion": require(__dirname + "/core").latestVersion,
                    });
                    break;
                default:
                    throw "Action " + frontendMessage.action + " not catched";
                    break;
            }
        } catch (e) {
            sendCallback({
                "error": {
                    "message": e.message,
                    "stack": self.userData && self.userData.admin ? e.stack : null
                }
            });
        }
    };

    /**
     * Convert to json
     * @returns {object}
     */
    this.toJSON = function () {
        return {"username": this.userData.username};
    };
}

/**
 * All user instances
 * @type []
 */
WebSocketUser.instances = [];

module.exports = WebSocketUser;