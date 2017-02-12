"use strict";
View.script = function (message) {
    Form.create($(".form"), "users", {
        "username": {"type": "text", "required": true},
        "password": {"type": "password", "required": true},
        "password2": {"type": "password", "required": true},
        "admin": {"type": "switch"}
    }, function (formData) {
        View.send({"action": "save", "formData": formData, "id" : get("id")}, function (message) {
            if (message === true) {
                note("saved", "success");
                View.loadUrl("/users");
            }
        });
    }, message.users[get("id")] || null);

    // write to table
    var tbody = $("table.data-table tbody");
    $.each(message.users, function (userKey, user) {
        tbody.append('<tr><td>' + user.username + '</td>' +
            '<td>' + t(user.admin ? "yes" : "no") + '</td>' +
            '<td><a href="/users?id=' + userKey + '"  data-translate="edit" ' +
            'class="btn btn-info btn-sm page-link"></a></td>' +
            '</tr>');
    });
};