"use strict";

/**
 * Simple view management
 */
var View = {};

/**
 * The script to execute
 * @type {function|null}
 */
View.script = null;

/**
 * The current view
 * @type {null}
 */
View.current = null;

/**
 * Load given view
 * @param {string} view
 */
View.load = function (view) {
    View.current = view;
    var $content = $("#content");
    $content.html('');
    spinner($content);
    View.send(null, function (message) {
        if (message && message.accessdenied) {
            note("access.denied", "danger");
            return;
        }
        if (message && message.redirect) {
            View.loadUrl(message.redirect);
            return;
        }
        $.get("views/" + view + ".html", function (htmlData) {
            $content.html(htmlData);
            $.getScript("views/" + view + ".js", function () {
                if (View.script) View.script(message);
                View.script = null;
                lang.replaceInHtml($content);
            });
        });
    })
};

/**
 * Send a message to the backend
 * @param {object=} message
 * @param {function=} callback
 */
View.send = function (message, callback) {
    Socket.send("view", {"view": View.current, "message": message}, callback);
};

/**
 * Load view by given url
 * @param {string} url
 */
View.loadUrl = function (url) {
    history.pushState({"url": url}, url, url);
    var view = url.match(/([a-z_-]+)/i)[1];
    if (!view || !view.length) view = "index";
    View.load(view);
};