"use strict";

var request = require("request");
/**
 * Core
 * @type {object}
 */
var core = {};

/** @type {string} */
core.latestVersion = "";

/**
 * Fetch latest version for the core
 */
core.fetchLatestVersion = function () {
    request("https://raw.githubusercontent.com/brainfoolong/brains-game-server-manager/master/package.json", function (error, response, body) {
        if (!error) {
            var manifest = JSON.parse(body);
            if (manifest && manifest.version) {
                core.latestVersion = manifest.version;
            }
        }
    });
};

// fetch latest version each hour
setInterval(core.fetchLatestVersion, 1000 * 60 * 60);
// and call 5 second after server startup
setTimeout(core.fetchLatestVersion, 5000);


module.exports = core;