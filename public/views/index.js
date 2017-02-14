"use strict";
View.script = function (message) {

    var consoleLog = $(".console-log");
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


    var addConsoleLogMessage = function (messageData) {
        consoleLog.append($('<div>').addClass("line type-" + messageData.type).html('<time>' + new Date(messageData.time).toLocaleString() + '</time><div class="message text-' + messageData.type + '">' + messageData.message + '</div>'));
        if (autoscroll.val() == "true") {
            scrollTo(consoleLog, 999999999);
        }
    };

    var updateServerInfo = function () {
        View.send({"action": "serverStatus", "id": get("id")}, function (status) {
            // @todo status
            console.log(status);
        });
    };


    if (get("id")) {
        Interval.create("index.serverinfo", updateServerInfo, 10000);
        updateServerInfo();
        Socket.onMessage("console-tail", function (action, message) {
            if (action == "console-tail" && message.server == get("id")) {
                addConsoleLogMessage(message.data);
            }
        });
        View.send({"action": "load", "id": get("id")}, function (loadMessage) {
            if (loadMessage && loadMessage.serverData) {
                $.get("views/games/" + loadMessage.serverData.game + ".html", function (html) {
                    $(".game-content").html(html);
                    $.getScript("views/games/" + loadMessage.serverData.game + ".js", function () {
                        if (View.script) View.script(message);
                        View.script = null;
                        lang.replaceInHtml($(".game-content"));
                        collapsable($(".game-content"));
                    });
                });

                var lines = loadMessage.consoleLog.split("\n");
                if (lines.length) {
                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i];
                        if (!line) continue;
                        addConsoleLogMessage(JSON.parse(line));
                    }
                }

                $(".index-server").removeClass("hidden");
                View.send({"action": "getVersions", "id": get("id")}, function (versions) {
                    $(".view-content").addClass(versions.installed ? "installed" : "not-installed");
                    $(".version-installed").text(versions.installed);
                    $(".version-available").text(versions.available);
                });
            }
        });
    }
};