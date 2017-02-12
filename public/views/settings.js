"use strict";
View.script = function (message) {
    var values = {};
    values.steamcmd = message.steamcmd;
    var form = $(".form");
    Form.create(form, "settings", {
        "steamcmd": {
            "type": "text",
            "placeholder": message.steamcmdDefault ? "settings.default_placeholder" : null,
            "lang_parameters": {"cmd": message.steamcmdDefault, "install": "sudo apt-get install steamcmd"}
        }
    }, function (formData) {
        View.send({"action": "save", "formData": formData}, function (message) {
            if (message === true) {
                note("saved", "success");
                View.loadUrl("/settings");
            }
        });
    }, values);


};