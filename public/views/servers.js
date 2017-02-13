"use strict";
View.script = function (message) {
    var form = $(".form");
    var fields = {
        "game": {"type": "select", "values": ["", "rust", "csgo", "factorio"], "required": true},
        "name": {"type": "text", "required": true},
        "factorio[branch]": {"type": "select", "values" : ["stable", "experimental"], "attributes": {"game-field": "1"}, "defaultValue": 0},
        "factorio[port]": {"type": "number", "attributes": {"game-field": "1"}, "defaultValue": 34197},
        "factorio[rcon_port]": {"type": "number", "attributes": {"game-field": "1"}, "defaultValue": 0},
        "factorio[rcon_password]": {"type": "text", "attributes": {"game-field": "1"}},
        "factorio[name]": {"type": "text", "attributes": {"required": "1", "game-field": "1"}},
        "factorio[description]": {"type": "text", "attributes": {"required": "1", "game-field": "1"}},
        "factorio[tags]": {"type": "text", "attributes": {"game-field": "1"}},
        "factorio[max_players]": {"type": "number", "attributes": {"game-field": "1"}},
        "factorio[visibility]": {
            "type": "select",
            "multiple": true,
            "values": ["public", "lan"],
            "attributes": {"game-field": "1", "required" : "1"}
        },
        "factorio[username]": {"type": "text", "attributes": {"game-field": "1"}},
        "factorio[password]": {"type": "text", "attributes": {"game-field": "1"}},
        "factorio[token]": {"type": "text", "attributes": {"game-field": "1"}},
        "factorio[game_password]": {"type": "text", "attributes": {"game-field": "1"}},
        "factorio[admins]": {"type": "text", "attributes": {"game-field": "1"}},
        "factorio[require_user_verification]": {
            "type": "switch",
            "attributes": {"game-field": "1"},
            "defaultValue": true
        },
        "factorio[max_upload_in_kilobytes_per_second]": {
            "type": "number",
            "attributes": {"game-field": "1"},
            "defaultValue": 0
        },
        "factorio[minimum_latency_in_ticks]": {"type": "number", "attributes": {"game-field": "1"}, "defaultValue": 0},
        "factorio[ignore_player_limit_for_returning_players]": {
            "type": "switch",
            "attributes": {"game-field": "1"},
            "defaultValue": false
        },
        "factorio[allow_commands]": {
            "type": "select",
            "values": ["true", "admins-only", "false"],
            "attributes": {"game-field": "1"},
            "defaultValue": "admins-only"
        },
        "factorio[autosave_interval]": {"type": "number", "attributes": {"game-field": "1"}, "defaultValue": 15},
        "factorio[autosave_slots]": {"type": "number", "attributes": {"game-field": "1"}, "defaultValue": 5},
        "factorio[afk_autokick_interval]": {"type": "number", "attributes": {"game-field": "1"}, "defaultValue": 0},
        "factorio[auto_pause]": {"type": "switch", "attributes": {"game-field": "1"}, "defaultValue": true},
        "factorio[autosave_only_on_server]": {"type": "switch", "attributes": {"game-field": "1"}, "defaultValue": true}
    };
    Form.create(form, "servers", fields, function (formData) {
        View.send({"action": "save", "formData": formData, "id" : get("id")}, function (message) {
            if (message === true) {
                note("saved", "success");
                View.loadUrl("/servers");
            }
        });
    }, message.servers[get("id")]);
    form.on("change", "[name='game']", function () {
        form.find("[data-game-field]").removeAttr("required").attr("disabled", true).closest(".form-field").addClass("hidden");
        var game = this.value;
        if (!game) {
            return;
        }
        form.find("[data-game-field]").each(function () {
            if ($(this).attr("name").substr(0, game.length + 1) == game + "[") {
                $(this).removeAttr("disabled").closest(".form-field").removeClass("hidden");
                if ($(this).attr("data-required")) {
                    $(this).attr("required", true);
                }
                if ($(this).is("select")) {
                    $(this).selectpicker("refresh");
                }
            }
        });
    });

    form.find("[name='game']").trigger("change");

    // write to table
    var tbody = $("table.data-table tbody");
    $.each(message.servers, function (serverKey, server) {
        tbody.append('<tr><td>' + server.name + '</td>' +
            '<td><a href="/servers?id=' + serverKey + '"  data-translate="edit" ' +
            'class="btn btn-info btn-sm page-link"></a></td>' +
            '</tr>');
    });
};