"use strict";
View.script = function (message) {

    for (var i in message.serverlist) {
        var server = message.serverlist[i];
        $(".pickserver select").append($('<option>').attr("value", i).text(server));
    }
    lang.replaceInHtml($(".pickserver"));
    $(".pickserver select").val(get("id")).selectpicker().on("change", function () {
        location.href = "/index?id=" + this.value;
    });

    $(".btn.update-server").on("click", function () {
        Modal.confirm(t("index.update-server.confirm"), function (success) {
            if (success) {
                View.send({"action": "updateServer", "id": get("id")}, function () {

                });
            }
        });
    });

    if (get("id")) {
        View.send({"action": "load", "id": get("id")}, function (serverdata) {
            if (serverdata) {
                $(".index-server").removeClass("hidden");
                View.send({"action": "getVersions", "id": get("id")}, function (versions) {
                    $(".version-installed").text(versions.installed);
                    $(".version-available").text(versions.available);
                });
            }
        });
    }
};