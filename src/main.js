"use strict";
/**
 * Main script
 */
Error.stackTraceLimit = Infinity;

process.umask(0);

var mode = process.argv[2];
if (!mode) {
    process.stdout.write("Usage: node main.js start|update-core");
    process.exit(0);
    return;
}

if (mode == "start") {
    require(__dirname + "/routes");
    require(__dirname + "/websocketmgr");
    require(__dirname + "/config");
    require(__dirname + "/core");
    return;
}

// update core
if (mode == "update-core") {
    var request = require(__dirname + "/request");
    var fs = require("fs");
    var unzip = require("unzip");
    request.get("https://codeload.github.com/brainfoolong/brains-game-server-manager/zip/master", true, function (contents) {
        if (!contents.length) {
            console.error("Cannot load repository zip file");
            process.exit(0);
            return;
        }
        var dir = __dirname + "/..";
        fs.writeFile(dir + "/master.zip", contents, {"mode": 0o777}, function () {
            fs.createReadStream(dir + "/master.zip").pipe(unzip.Parse()).on('entry', function (entry) {
                var fileName = entry.path.split("/").slice(1).join("/");
                if (!fileName.length) return;
                var path = dir + "/" + fileName;
                if (entry.type == "Directory") {
                    if (!fs.existsSync(path)) fs.mkdirSync(path, 0o777);
                    entry.autodrain();
                } else {
                    entry.pipe(fs.createWriteStream(path));
                }
            }).on("close", function () {
                process.stdout.write("Application successfully updated\n");
                fs.unlinkSync(dir + "/master.zip");
                process.exit(0);
            });
        });
    });
}