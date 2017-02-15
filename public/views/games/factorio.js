"use strict";
View.script = function () {
    var selectValues = ["none", "very-low", "low", "normal", "high", "very-high"];
    var fields = {
        "id": {"type": "text", "required": true, "pattern": "[a-z_0-9-]+"},
        "active": {"type": "switch", "defaultValue": false},
        "width": {"type": "number", "defaultValue": 0},
        "height": {"type": "number", "defaultValue": 0},
        "peaceful_mode": {"type": "switch", "defaultValue": false},
        "terrain_segmentation": {
            "type": "select",
            "values": selectValues,
            "defaultValue": "normal",
            "langKeyValues": "factoriomaps.map.value"
        }
    };
    if (get("map")) {
        delete fields.id;
    }
    var resources = ["coal", "copper-ore", "crude-oil", "enemy-base", "iron-ore", "stone"];
    var types = ["frequency", "size", "richness"];
    for (var i in resources) {
        fields["autoplace_controls[" + resources[i] + "][title]"] = {
            "type": "none",
            "langKey": "factoriomaps.resource",
            "langParams": {"resource": t("factoriomaps.resource." + resources[i])}
        };
        for (var j in types) {
            fields["autoplace_controls[" + resources[i] + "][" + types[j] + "]"] = {
                "type": "select",
                "values": selectValues,
                "defaultValue": "normal",
                "langKeyValues": "factoriomaps.map.value",
                "attachTo": types[j] == "frequency" ? null : "autoplace_controls[" + resources[i] + "][frequency]"
            };
        }
    }
    $("table.factorio-maps-table").on("click", ".delete", function () {
        var mapId = $(this).closest("tr").attr("data-id");
        Modal.confirm(t("factoriomaps.delete"), function (success) {
            if (success) {
                View.send({"action": "deleteMap", "id": get("id"), "map": mapId}, function () {
                    loadMaps();
                });
            }
        });
    });
    var loadMaps = function () {
        View.send({"action": "getMaps", "id": get("id")}, function (mapsData) {
            // write to table
            var $tbody = $("table.factorio-maps-table tbody");
            $tbody.children().remove();
            $.each(mapsData, function (mapId, mapData) {
                $tbody.append('<tr data-id="' + mapId + '"><td>' + mapId + '</td>' +
                    '<td>' + t(mapData.active ? "yes" : "no") + '</td>' +
                    '<td><a href="/index?id=' + get("id") + '&map=' + mapId + '" data-translate="edit" ' +
                    'class="btn btn-info btn-sm page-link"></a><span class="btn btn-danger btn-sm delete" data-translate="delete"></span></td>' +
                    '</tr>');
            });
            lang.replaceInHtml($tbody);

            var $mapform = $(".map-form");
            $mapform.html('');
            Form.create($mapform, "factoriomaps", fields, function (formData) {
                View.send({"action": "saveMap", "id": get("id"), "map": get("map"), "formData": formData}, function () {
                    View.loadUrl("/index?id=" + get("id"));
                });
            }, mapsData[get("map")]);

            if (get("map")) {
                scrollTo("body", "#form-factoriomaps");
            }
        });
    };
    loadMaps();
};