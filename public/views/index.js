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

    autoscroll.val("yes");
    $("select.selectpicker").selectpicker();

    $(".btn.update-server").on("click", function () {
        Modal.confirm(t("index.update-server.confirm"), function (success) {
            if (success) {
                View.send({"action": "updateServer", "id": get("id")}, function () {

                });
            }
        });
    });

    /**
     * Scroll console to given position
     * @param {number} pos
     */
    var scrollTo = function (pos) {
        $({"pos": consoleLog.scrollTop()}).animate({"pos": pos}, {
            duration: 300,
            step: function () {
                consoleLog.scrollTop(this.pos);
            }
        });
    };

    var addConsoleLogMessage = function (messageData) {
        consoleLog.append($('<div>').addClass("line type-" + messageData.type).html('<time>' + new Date(messageData.time).toLocaleString() + '</time><div class="message text-' + messageData.type + '">' + messageData.message + '</div>'));
        if (autoscroll.val() == "yes") {
            scrollTo(999999999);
        }
    };

    if (get("id")) {
        Socket.onMessage("console-tail", function (action, message) {
            if (action == "console-tail" && message.server == get("id")) {
                addConsoleLogMessage(message.data);
            }
        });
        View.send({"action": "load", "id": get("id")}, function (loadMessage) {
            if (loadMessage) {
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
                    $(".version-installed").text(versions.installed);
                    $(".version-available").text(versions.available);
                });
            }
        });
    }
};