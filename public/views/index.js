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

    if(get("id")) {
        View.send({"action": "load", "id": get("id")}, function (serverdata) {
            if(serverdata){
                $(".index-server").removeClass("hidden");
            }
        });
    }
};