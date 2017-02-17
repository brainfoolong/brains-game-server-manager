"use strict";
View.script = function (message) {
    var $form = $(".form");
    Form.create($form, "login", {
        "username": {"type": "text", "required": true},
        "password": {"type": "password", "required": true},
        "remember": {"type": "switch"}
    }, function (formData) {
        View.send({"action": "login", "formData": formData}, function (message) {
            if (message.userData) {
                note("login.success", "success");
                var session = !formData.remember;
                Storage.set("loginName", message.userData.username, session);
                Storage.set("loginHash", message.userData.loginHash, session);
                location.href = "/index";
            }
        });
    });

    $form.find(".submit-form").text(t("login.btn"))
};