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
        var $input = null;
        var langKey = formName + '.' + fieldName;
        var $el = $('<div>' +
            '<div class="form-label"></div>' +
            '<div class="form-input"></div>' +
            '</div>');
        if (t(langKey + ".title") != langKey + ".title") {
            $el.find(".form-label").append($("<strong>").text(t(langKey + ".title")));
        }
        if (t(langKey + ".sub") != langKey + ".sub") {
            $el.find(".form-label").append($("<small>").text(t(langKey + ".sub")));
        }
        switch (field.type) {
            case "textarea":
                $input = $('<textarea class="form-control autoheight" name="' + fieldName + '">');
                if (typeof values[fieldName] != "undefined") {
                    $input.val(values[fieldName]);
                }
                break;
            case "number":
                $input = $('<input type="number" class="form-control" name="' + fieldName + '">');
                if (typeof values[fieldName] != "undefined") {
                    $input.val(values[fieldName]);
                }
                break;
            case "password":
                $input = $('<input type="password" class="form-control" name="' + fieldName + '">');
                if (typeof values[fieldName] != "undefined") {
                    $input.val(values[fieldName]);
                }
                break;
            case "text":
                $input = $('<input type="text" class="form-control" name="' + fieldName + '">');
                if (typeof values[fieldName] != "undefined") {
                    $input.val(values[fieldName]);
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
                if (typeof values[fieldName] != "undefined") {
                    $input.val(values[fieldName]);
                }
                break;
            case "switch":
                $input = $('<select class="selectpicker" name="' + fieldName + '">');
                var fieldValues = ["yes", "no"];
                for (var i = 0; i < fieldValues.length; i++) {
                    var valueKey = fieldValues[i];
                    $input.append($('<option>').attr("value", valueKey).text(t(valueKey)));
                }
                if (values[fieldName] === true) {
                    $input.val("yes");
                }
                break;
        }
        if (field.required) {
            $input.attr("required", true);
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
            var formData = {};
            for (var fieldName in fields) {
                var field = fields[fieldName];
                formData[fieldName] = formDataJson[fieldName];
                switch (field.type) {
                    case "number":
                        formData[fieldName] = parseFloat(formData[fieldName]);
                        break;
                    case "switch":
                        formData[fieldName] = formData[fieldName] === "yes";
                        break;
                }
            }
            onSubmit(formData);
        } else {
            // on validation error trigger a fake submit button to enable validation UI popup
            $(this).after('<input type="submit">');
            $(this).next().trigger("click").remove();
        }
    })
};