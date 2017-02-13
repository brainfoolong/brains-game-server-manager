"use strict";
View.script = function (message) {
    var values = message;
    var form = $(".form");
    Form.create(form, "settings", {
        "steamcmd": {
            "type": "text",
            "placeholder": message.steamcmdDefault ? "settings.default_placeholder" : null,
            "lang_parameters": {"cmd": message.steamcmdDefault, "install": "sudo apt-get install steamcmd"}
        },
        "tar": {
            "type": "text",
            "placeholder": message.tarDefault ? "settings.default_placeholder" : null,
            "lang_parameters": {"cmd": message.tarDefault, "install": "sudo apt-get install tar"}
        },
        "unzip": {
            "type": "text",
            "placeholder": message.unzipDefault ? "settings.default_placeholder" : null,
            "lang_parameters": {"cmd": message.unzipDefault, "install": "sudo apt-get install unzip"}
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