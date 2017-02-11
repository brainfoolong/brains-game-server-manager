"use strict";
/**
 * Express routes, url handling
 */
const express = require('express');
const path = require('path');
const app = express();
const config = require(__dirname + "/config");

// output the required ws port number
app.get("/wsport", function (req, res) {
    res.send((config.port + 1).toString());
});

app.use(express.static(__dirname + "/../public"));

app.get(/^\/[a-z0-9_-]+$/, function (req, res, next) {
    res.sendFile(path.resolve(__dirname + "/../public/index.html"));
});

app.listen(config.port, config.host, function () {

});
