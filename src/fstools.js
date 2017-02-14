"use strict";

var fs = require("fs");
var Tail = require('tail').Tail;

/**
 * FS helper tools
 */
var fstools = {};

/**
 * Tailed files
 * @type {object<string, Tail>}
 */
fstools.tailedFiles = {};

/**
 * Delete directories and files recursive
 * Use with caution
 * @param {string} path
 */
fstools.deleteRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                fstools.deleteRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

/**
 * Tail a file
 * @param {string} file
 * @param {function} callback
 */

fstools.tailFile = function (file, callback) {
    if (typeof fstools.tailedFiles[file] != "undefined") {
        fstools.tailedFiles[file].unwatch();
        delete fstools.tailedFiles[file];
    }
    var tail = new Tail(file);

    tail.on("line", callback);

    tail.on("error", function () {
        if (typeof fstools.tailedFiles[file] != "undefined") {
            fstools.tailedFiles[file].unwatch();
            delete fstools.tailedFiles[file];
        }
    });

    fstools.tailedFiles[file] = tail;
};

module.exports = fstools;