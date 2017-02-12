"use strict";

/**
 * Form creator
 */
var Form = {};

/**
 * Create a form table by given props
 * @param {JQuery} container
 * @param {string} formName
 * @param {object} fields
 * @param {function=} onSubmit
 * @param {object=} values
 */
Form.create = function (container, formName, fields, onSubmit, values) {
    if (!values) values = {};
    var $form = $('<form>').attr("name", formName).attr("onsubmit", "return false");
    for (var fieldName in fields) {
        var field = fields[fieldName];
        var fieldNameMatch = fieldName.match(/^(.*?)\[(.*?)\]/);
        var currentValue = values[fieldName];
        if (fieldNameMatch) {
            if (typeof values[fieldNameMatch[1]] != "undefined") {
                currentValue = values[fieldNameMatch[1]][fieldNameMatch[2]];
            }
        }
        if (typeof currentValue == "undefined") currentValue = field.defaultValue;
        if (typeof currentValue == "undefined") currentValue = null;
        var $input = null;
        var langKey = formName + '.' + fieldName;
        var $el = $('<div class="form-field">' +
            '<div class="form-label"></div>' +
            '<div class="form-input"></div>' +
            '</div>');
        if (t(langKey + ".title") != langKey + ".title") {
            $el.find(".form-label").append($("<strong>").text(t(langKey + ".title", field.lang_parameters)));
        }
        if (t(langKey + ".sub") != langKey + ".sub") {
            $el.find(".form-label").append($("<small>").text(t(langKey + ".sub", field.lang_parameters)));
        }
        switch (field.type) {
            case "textarea":
                $input = $('<textarea class="form-control autoheight" name="' + fieldName + '">');
                if (currentValue !== null) {
                    $input.val(currentValue);
                }
                break;
            case "number":
                $input = $('<input type="number" class="form-control" name="' + fieldName + ':number">');
                if (currentValue !== null) {
                    $input.val(currentValue);
                }
                break;
            case "password":
                $input = $('<input type="password" class="form-control" name="' + fieldName + '">');
                if (currentValue !== null) {
                    $input.val(currentValue);
                }
                break;
            case "text":
                $input = $('<input type="text" class="form-control" name="' + fieldName + '">');
                if (currentValue !== null) {
                    $input.val(currentValue);
                }
                break;
            case "select":
                var name = fieldName;
                if (field.multiple) name += "[]";
                $input = $('<select class="selectpicker" name="' + name + '">');
                if (field.multiple) $input.attr("multiple", true);
                for (var i = 0; i < field.values.length; i++) {
                    var valueKey = field.values[i];
                    $input.append($('<option>').attr("value", valueKey).text(t(formName + '.' + fieldName + '.value.' + valueKey)));
                }
                if (currentValue !== null) {
                    $input.val(currentValue);
                }
                break;
            case "switch":
                $input = $('<select class="selectpicker" name="' + fieldName + ':boolean">');
                var fieldValues = ["yes", "no"];
                for (var i = 0; i < fieldValues.length; i++) {
                    var valueKey = fieldValues[i];
                    $input.append($('<option>').attr("value", valueKey).text(t(valueKey)));
                }
                if (currentValue !== null) {
                    $input.val(currentValue ? "true" : "false");
                }
                break;
        }
        if (field.required) {
            $input.attr("required", true);
        }
        if (field.placeholder) {
            $input.attr("placeholder", t(field.placeholder, field.lang_parameters));
        }
        if (field.attributes) {
            for (var i in field.attributes) {
                $input.attr("data-" + i, field.attributes[i]);
            }
        }
        $el.find(".form-input").append($input);
        $form.append($el);
    }
    $form.append('<span data-name="save" data-translate="save" class="btn btn-default btn-info submit-form "></span>');
    lang.replaceInHtml($form);
    $form.find(".selectpicker").selectpicker();
    container.append($form);
    $form.on("click", ".submit-form", function () {
        var f = $(this).closest("form");
        if (f[0].checkValidity()) {
            var formDataJson = f.serializeJSON();
            onSubmit(formDataJson);
        } else {
            // on validation error trigger a fake submit button to enable validation UI popup
            $(this).after('<input type="submit">');
            $(this).next().trigger("click").remove();
        }
    })
};