"use strict";
View.script = function (message) {

    var $logWindow = $(".log-window");
    var $autoscroll = $(".autoscroll");
    var $pickserver = $(".pickserver select");
    var $filebrowser = $(".filebrowser");

    /**
     * Add a log message
     * @param {object} messageData
     * @param {boolean} fromTail
     */
    var addLogMessage = function (messageData, fromTail) {
        var langKey = messageData.message;
        var langParams = null;
        if (typeof messageData.message == "object") {
            langKey = messageData.message[0];
            langParams = messageData.message[1];
        }
        var $message = $('<div>').addClass("line type-" + messageData.type).html('<time>' + new Date(messageData.time).toLocaleString() + '</time><div class="message text-' + messageData.type + '"></div>');
        if (!messageData.time) $message.find("time").remove();
        $message.find(".message").html(t(langKey, langParams));
        $logWindow.append($message);
        if ($autoscroll.val() == "true") {
            scrollTo($logWindow, 999999999);
        }
        if (fromTail && (messageData.type == "success" || messageData.type == "error")) {
            updateServerStatus();
            updateBackups();
        }
    };

    /**
     * Update server status
     */
    var updateServerStatus = function () {
        View.send({"action": "getServerStatus", "id": get("id")}, function (status) {
            if (status) {
                $(".view-content").removeClass("status-stopped status-running").addClass("status-" + status.status);
                $(".server-status").text(t("index.serverstatus." + status.status));
            }
        });
    };

    /**
     * Update backups
     */
    var updateBackups = function () {
        View.send({"action": "getBackups", "id": get("id")}, function (files) {
            $(".existing-backups").toggleClass("hidden", !files.length);
            // write to table
            var $tbody = $(".existing-backups table tbody");
            $tbody.html('');
            $.each(files, function (id, file) {
                var $tr = $('<tr data-id="' + file.name + '"><td class="download pointer" data-tooltip="Download">' + file.name + '</td>' +
                    '<td>' + (file.size / 1024 / 1024).toFixed(2) + 'MB</td>' +
                    '<td><span class="btn btn-info btn-sm import" data-translate="index.backup.import"></span><span class="btn btn-danger btn-sm delete" data-translate="delete"></span></td>' +
                    '</tr>');
                $tr.attr("data-id", file.name);
                $tr.attr("data-path", file.path);
                $tbody.append($tr);
            });
            lang.replaceInHtml($tbody);
        });
    };

    /**
     * Load filebrowser for given folder
     * @param {string} folder
     */
    var loadFilebrowser = function (folder) {
        var parent = "";
        if (folder.match(/\//)) {
            var folders = folder.split("/");
            folders.pop();
            parent = folders.join("/");
        }
        $filebrowser.html('<div class="current-folder" data-folder="' + folder + '">' + folder + '</div>');
        $filebrowser.append('<div class="text-right"><select class="selectpicker">' +
            '<option value="" data-translate="index.filebrowser.action"></option>' +
            '<option value="createfile" data-translate="index.filebrowser.createfile"></option>' +
            '<option value="createdir" data-translate="index.filebrowser.createdir"></option>' +
            '<option value="uploadfile" data-translate="index.filebrowser.uploadfile"></option>' +
            '<option value="uploadarchive" data-translate="index.filebrowser.uploadarchive"></option>' +
            '</select></div>');
        lang.replaceInHtml($filebrowser);
        $filebrowser.find(".selectpicker").selectpicker().on("change", function () {
            var v = this.value;
            $(this).selectpicker("val", "");
            switch (v) {
                case "uploadfile":
                case "uploadarchive":
                    var $html = $('<div>');
                    var fileData = "";
                    var fileName = "";
                    $html.append($('<input type="file" class="form-control">').attr("placeholder", t("index.filebrowser.upload.placeholder")));
                    $html.append('<div class="file"></div>');
                    $html.find("input").on("change", function (ev) {
                        var files = ev.target.files;
                        for (var i = 0, f; f = files[i]; i++) {
                            var reader = new FileReader();
                            reader.onload = (function (theFile) {
                                return function (e) {
                                    $html.find(".file").append(theFile.name + " | " + theFile.size + " bytes");
                                    fileName = theFile.name;
                                    fileData = e.target.result;
                                };
                            })(f);
                            reader.readAsBinaryString(f);
                        }
                    });
                    Modal.confirm($html, function (success) {
                        if (success && fileName.length) {
                            note("index.filebrowser.upload.progress");
                            setTimeout(function () {
                                View.send({
                                    "action": "uploadFile",
                                    "id": get("id"),
                                    "folder": folder,
                                    "file": fileName,
                                    "data": btoa(fileData),
                                    "isArchive": v == "uploadarchive"
                                }, function (success) {
                                    loadFilebrowser(folder);
                                });
                            }, 500);
                        }
                    });
                    break;
                case "createfile":
                case "createdir":
                    Modal.prompt("", t("index.filebrowser.create.placeholder"), function (name) {
                        if (name !== false && name.length) {
                            View.send({
                                "action": "createFileDir",
                                "id": get("id"),
                                "folder": folder,
                                "file": name,
                                "isDirectory": v == "createdir"
                            }, function (success) {
                                if (success) {
                                    loadFilebrowser(folder);
                                } else {
                                    note("index.filebrowser.create.error", "error");
                                }
                            });
                        }
                    });
                    break;
            }
        });
        if (folder) {
            $filebrowser.append('<div class="parent-folder select-folder entry" data-relative-path="' + parent + '">' + t("index.filebrowser.parent") + '</div>');
        }
        View.send({"action": "getFilelist", "id": get("id"), "folder": folder}, function (files) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var path = folder + "/" + file.name;
                var $entry = $('<div class="entry"><div class="name"></div><div class="size"></div></div>');
                $entry.attr("data-relative-path", path);
                $entry.attr("data-path", file.path);
                $entry.attr("data-folder", folder);
                $entry.attr("data-name", file.name);
                $entry.addClass((file.isDirectory ? "select-folder folder" : "select-file file"));
                $entry.find(".name").text(file.name);
                $entry.find(".size").text((file.size / 1024).toFixed(2) + ' kB | ' + new Date(file.mtime).toLocaleString());
                $entry.append('<div class="icons"><span class="glyphicon glyphicon-download" data-translate-property="data-tooltip,index.filebrowser.download"></span><span class="glyphicon glyphicon-remove-circle" data-translate-property="data-tooltip,index.filebrowser.remove"></span></div>');
                $filebrowser.append($entry);
            }
            lang.replaceInHtml($filebrowser);
        });
    };

    var downloadFile = function (path, filename) {
        View.send({"action": "downloadFile", "id": get("id"), "file": path}, function (success) {
            if (success === true) {
                window.open("/download-file/" + filename);
            }
        });
    };

    $filebrowser.on("click", ".select-folder", function () {
        loadFilebrowser($(this).attr("data-relative-path"));
    }).on("click", ".select-file", function () {
        var $textarea = $('<textarea class="autoheight form-control">');
        $textarea.val('loading...');
        var file = $(this).attr("data-relative-path");
        var folder = $(this).attr("data-folder");
        Modal.confirm($textarea, function (success) {
            if (success) {
                View.send({"action": "saveFile", "id": get("id"), "file": file, "data": $textarea.val()}, function () {
                    loadFilebrowser(folder);
                });
            }
        });
        View.send({"action": "loadFile", "id": get("id"), "file": file}, function (fileData) {
            $textarea.val(fileData);
            $("#confirm .modal-title").text(file);
            setTimeout(function () {
                textareaAutoheight($("#confirm"));
            }, 500);
        });
    }).on("click", ".glyphicon-download", function (ev) {
        ev.stopPropagation();
        var $entry = $(this).closest(".entry");
        downloadFile($entry.attr("data-path"), $entry.attr("data-name"));
    }).on("click", ".glyphicon-remove-circle", function (ev) {
        ev.stopPropagation();
        var $entry = $(this).closest(".entry");
        Modal.confirm(t("sure"), function (success) {
            if (success) {
                View.send({"action": "deleteFile", "id": get("id"), "file": $entry.attr("data-path")}, function () {
                    loadFilebrowser($entry.attr("data-folder"));
                });
            }
        });
    });

    $(".btn.update-server").on("click", function () {
        Modal.confirm(t("index.update-server.confirm"), function (success) {
            if (success) {
                note("index.update-server.scheduled", "info", 20000);
                View.send({"action": "updateServer", "id": get("id")}, function (success) {
                    if (success === true) {
                        location.reload();
                    }
                });
            }
        });
    });

    $(".btn.start-server").on("click", function () {
        Modal.confirm(t("index.start-server.confirm"), function (success) {
            if (success) {
                note("index.start-server.scheduled", "info", 20000);
                View.send({"action": "startServer", "id": get("id")}, function () {

                });
            }
        });
    });

    $(".btn.stop-server").on("click", function () {
        Modal.confirm(t("index.stop-server.confirm"), function (success) {
            if (success) {
                note("index.stop-server.scheduled", "info", 20000);
                View.send({"action": "stopServer", "id": get("id")}, function () {

                });
            }
        });
    });

    $(".log-tabs").on("click", "a", function (ev) {
        ev.preventDefault();
        $(".log-tabs li").removeClass("active");
        var $li = $(this).closest("li");
        $li.addClass("active");
        Storage.set("index.logs.last", $li.attr("data-id"));
        $logWindow.html(t("loading"));

        View.send({"action": "loadLog", "id": get("id"), "file": $li.attr("data-id")}, function (fileData) {
            $logWindow.html('');
            if (fileData) {
                var lines = fileData.split("\n");
                if (lines.length) {
                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i];
                        if (!line) continue;
                        if (line.substr(0, 1) == "{" && line.substr(-1) == "}") {
                            addLogMessage(JSON.parse(line));
                        } else {
                            addLogMessage({"time": null, "message": line, "type": "debug"});
                        }
                    }
                }
            }
        });
    });

    $(".create-backup").on("click", function () {
        Modal.confirm(t("index.backup.confirm"), function (success) {
            if (success) {
                View.send({"action": "createServerBackup", "id": get("id")}, function () {

                });
            }
        });
    });

    $(".existing-backups").on("click", ".import", function () {
        var file = $(this).closest("tr").attr("data-id");
        Modal.confirm(t("index.backup.import.confirm"), function (success) {
            if (success) {
                View.send({"action": "loadServerBackup", "id": get("id"), "file": file}, function () {

                });
            }
        });
    }).on("click", ".delete", function () {
        var file = $(this).closest("tr").attr("data-id");
        Modal.confirm(t("index.backup.delete.confirm"), function (success) {
            if (success) {
                View.send({"action": "deleteServerBackup", "id": get("id"), "file": file}, function () {
                    updateBackups();
                });
            }
        });
    }).on("click", ".download", function () {
        var $tr = $(this).closest("tr");
        downloadFile($tr.attr("data-path"), $tr.attr("data-id"));
    });

    $(".pipe-command").on("keyup", function (ev) {
        if (ev.keyCode == 13) {
            var cmd = this.value;
            this.value = "";
            View.send({"action": "pipeCommand", "id": get("id"), "command": cmd}, function () {

            });
        }
    });

    $pickserver.on("change", function () {
        location.href = "/index?id=" + this.value;
    });

    for (var i in message.serverlist) {
        var server = message.serverlist[i];
        $pickserver.append($('<option>').attr("value", i).text(server));
    }
    lang.replaceInHtml($("#content"));
    $pickserver.val(get("id"));

    $autoscroll.val("true");
    $("select.selectpicker").selectpicker();

    if (get("id")) {

        $(".log-tabs li").filter("[data-id='" + (Storage.get("index.logs.last") || "console") + "']").find("a").trigger("click");

        Interval.create("index.serverinfo", updateServerStatus, 10000);
        updateServerStatus();
        Socket.onMessage("console-tail", function (action, message) {
            if (action == "console-tail" && message.server == get("id") && $(".log-tabs .active").attr("data-id") == "console") {
                addLogMessage(message.data, true);
            }
        });
        Socket.onMessage("output-tail", function (action, message) {
            if (action == "output-tail" && message.server == get("id") && $(".log-tabs .active").attr("data-id") == "output") {
                addLogMessage(message.data, true);
            }
        });
        Socket.onMessage("error-tail", function (action, message) {
            if (action == "error-tail" && message.server == get("id") && $(".log-tabs .active").attr("data-id") == "error") {
                addLogMessage(message.data, true);
            }
        });
        Socket.onMessage("steamcmd-tail", function (action, message) {
            if (action == "steamcmd-tail" && message.server == get("id") && $(".log-tabs .active").attr("data-id") == "steamcmd") {
                addLogMessage(message.data, true);
            }
        });
        View.send({"action": "load", "id": get("id")}, function (loadMessage) {
            if (loadMessage && loadMessage.serverData) {
                $(".view-content").addClass("game-" + loadMessage.serverData.game).attr("data-game", loadMessage.serverData.game);
                $(".log-tabs li")
                $.get("views/games/" + loadMessage.serverData.game + ".html", function (html) {
                    $(".game-content").html(html);
                    $.getScript("views/games/" + loadMessage.serverData.game + ".js", function () {
                        if (View.script) View.script(message);
                        View.script = null;
                        lang.replaceInHtml($(".game-content"));
                        collapsable($(".game-content"));
                    });
                });
                $(".index-server").removeClass("hidden");
                View.send({"action": "getInstalledVersion", "id": get("id")}, function (version) {
                    $(".view-content").addClass(version ? "installed" : "not-installed");
                    $(".version-installed").text(version);
                    View.send({"action": "getLatestVersion", "id": get("id")}, function (version) {
                        $(".version-available").text(version);
                    });
                });
                updateBackups();
                loadFilebrowser("");
            }
        });
    }
};