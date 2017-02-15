"use strict";
View.script = function (message) {

    var $logWindow = $(".log-window");
    var autoscroll = $(".autoscroll");

    for (var i in message.serverlist) {
        var server = message.serverlist[i];
        $(".pickserver select").append($('<option>').attr("value", i).text(server));
    }
    lang.replaceInHtml($("#content"));
    $(".pickserver select").val(get("id")).on("change", function () {
        location.href = "/index?id=" + this.value;
    });

    autoscroll.val("true");
    $("select.selectpicker").selectpicker();

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
                View.send({"action": "startServer", "id": get("id")}, function () {

                });
            }
        });
    });

    $(".btn.stop-server").on("click", function () {
        Modal.confirm(t("index.stop-server.confirm"), function (success) {
            if (success) {
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
    });

    $(".log-tabs li").filter("[data-id='" + (Storage.get("index.logs.last") || "console") + "']").find("a").trigger("click");

    var addLogMessage = function (messageData, fromTail) {
        if (fromTail && (messageData.type == "success" || messageData.type == "error")) {
            updateServerInfo();
            updateBackups();
        }
        var $message = $('<div>').addClass("line type-" + messageData.type).html('<time>' + new Date(messageData.time).toLocaleString() + '</time><div class="message text-' + messageData.type + '">' + messageData.message + '</div>');
        if (!messageData.time) $message.find("time").remove();
        $logWindow.append($message);
        if (autoscroll.val() == "true") {
            scrollTo($logWindow, 999999999);
        }
    };

    var updateServerInfo = function () {
        View.send({"action": "getServerStatus", "id": get("id")}, function (status) {
            if (status) {
                $(".view-content").removeClass("status-stopped status-running").addClass("status-" + status.status);
                $(".server-status").text(t("index.serverstatus." + status.status));
            }
        });
    };

    var updateBackups = function () {
        View.send({"action": "getBackups", "id": get("id")}, function (files) {
            $(".existing-backups").toggleClass("hidden", !files.length);
            // write to table
            var tbody = $(".existing-backups table tbody");
            tbody.html('');
            $.each(files, function (id, file) {
                tbody.append('<tr data-id="' + file.name + '"><td>' + file.name + '</td>' +
                    '<td>' + (file.size / 1024 / 1024).toFixed(2) + 'MB</td>' +
                    '<td><span class="btn btn-info btn-sm import" data-translate="index.backup.import"></span><span class="btn btn-danger btn-sm delete" data-translate="delete"></span></td>' +
                    '</tr>');
            });
            lang.replaceInHtml(tbody);
        });
    };

    if (get("id")) {
        Interval.create("index.serverinfo", updateServerInfo, 10000);
        updateServerInfo();
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
        View.send({"action": "load", "id": get("id")}, function (loadMessage) {
            if (loadMessage && loadMessage.serverData) {
                $(".view-content").addClass("game-" + loadMessage.serverData.game).attr("data-game", loadMessage.serverData.game);
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
            }
        });
    }
};