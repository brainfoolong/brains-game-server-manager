"use strict";

/**
 * Socket stuff
 */
var Socket = {};

/** @type {WebSocket} */
Socket.con = null;

/** @type {function[]} */
Socket.callbacks = [];

/** @type {object} */
Socket.queue = [];

/** @type {{}} */
Socket.onMessageEvents = {};

/** @type {number|null} */
Socket.port = null;

/**
 * The user data from the logged in user
 * @type {null|object}
 */
Socket.userData = null;

/**
 * Bind a callback to be triggered everytime a message is received
 * @param {string} id The handler id
 * @param {function} callback
 */
Socket.onMessage = function (id, callback) {
    Socket.onMessageEvents[id] = callback;
};

/**
 * Unbind a callback
 * @param {string} id
 */
Socket.offMessage = function (id) {
    delete Socket.onMessageEvents[id];
};

/**
 * Send the queue
 */
Socket.sendQueue = function () {
    // send all messages in the queue
    for (var i = 0; i < Socket.queue.length; i++) {
        var q = Socket.queue[i];
        Socket.send(q.action, q.message, q.callback);
    }
    Socket.queue = [];
};

/**
 * Connect to websocket
 * @param {function=} callback If connection is established
 */
Socket.connect = function (callback) {
    var cb = function () {
        var con = new WebSocket('ws://' + window.location.hostname + ':' + Socket.port);
        /**
         * On open connection
         */
        con.onopen = function () {
            Socket.con = con;
            // send init ping to backend
            Socket.send("init", null, function (message) {
                if (message.userData) {
                    Socket.userData = message.userData;
                }
                var b = $("body");
                if (Socket.userData) {
                    b.addClass("is-logged-in");
                    if (Socket.userData.admin) {
                        b.addClass("is-admin");
                    } else {
                        b.addClass("is-not-admin");
                    }
                } else {
                    b.addClass("is-not-logged-in is-not-admin");
                }
                if (message.package.version) {
                    $(".app-version").text(message.package.version);
                    if (message.latestVersion && message.package.version && message.latestVersion != message.package.version) {
                        $(".top-logo .update").removeClass("hidden");
                    }
                }
                if (callback) callback(message);
                Socket.sendQueue();
            });
        };

        /**
         * On websocket error
         * @param error
         */
        con.onerror = function (error) {
            console.error('WebSocket Error ' + error);
        };

        /**
         * On message received from backend
         */
        con.onmessage = function (e) {
            if (e.data) {
                var data = JSON.parse(e.data);
                if (data.action) {
                    if (typeof data.callbackId != "undefined") {
                        var callbackId = data.callbackId;
                        if (Socket.callbacks[callbackId] === null) {
                            console.error("No socket callback for id " + callbackId + ", maybe dupe callback in backend?");
                        } else {
                            Socket.callbacks[callbackId](data.message);
                            Socket.callbacks[callbackId] = null;
                        }
                    }
                    for (var i in Socket.onMessageEvents) {
                        if (Socket.onMessageEvents.hasOwnProperty(i)) {
                            var cb = Socket.onMessageEvents[i];
                            if (cb) cb(data.message);
                        }
                    }
                    // show server disconnect message
                    if (data.action == "serverDisconnect") {
                        note(t("server.disconnect") + ": " + data.message.servername, "danger");
                    }
                }
            }
        };

        /**
         * On connection close
         */
        con.onclose = function () {
            Socket.con = null;
            // reload page after 5 seconds
            note("socket.disconnect", "danger");
            spinner("#content");
            setTimeout(function () {
                window.location.reload();
            }, 5000);
        };
    };
    if (Socket.port) {
        cb();
    } else {
        // load the required port number
        $.get("wsport", function (port) {
            Socket.port = parseInt(port);
            cb();
        });
    }
};

/**
 * Connect to socket and load view for current url hash
 */
Socket.connectAndLoadView = function () {
    Socket.connect(function () {
        View.loadUrl(location.pathname + location.search);
    });
};

/**
 * Send a command to the backend
 * @param {string} action
 * @param {object=} message
 * @param {function=} callback
 */
Socket.send = function (action, message, callback) {
    var receiveCallback = function (receivedMessage) {
        if (receivedMessage && receivedMessage.note) {
            note(receivedMessage.note.message, receivedMessage.note.type, receivedMessage.note.delay);
        }
        if (receivedMessage && receivedMessage.error) {
            var message = "Server Error: " + receivedMessage.error.message;
            if (receivedMessage.error.stack) {
                message = "<strong>Server Error</strong>\n" + receivedMessage.error.stack;
            }
            $("#content").html($('<div class="alert alert-danger" style="white-space: pre-wrap"></div>').html(message));
            Socket.callbacks = [];
            return;
        }
        if (callback) callback(receivedMessage);
    };
    if (typeof message == "undefined") {
        message = null;
    }
    // if connection not yet established add to queue
    if (Socket.con === null) {
        Socket.queue.push({
            "action": action,
            "message": message,
            "callback": callback
        });
        return;
    }
    var data = {
        "action": action,
        "callbackId": Socket.callbacks.length,
        "message": message,
        "loginName": Storage.get("loginName"),
        "loginHash": Storage.get("loginHash")
    };
    Socket.callbacks.push(receiveCallback);
    Socket.con.send(JSON.stringify(data));
};