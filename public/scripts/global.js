"use strict";

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
function t(key, params) {
    return lang.get(key, params)
}

/**
 * Display a loading spinner in a given element
 * @param {string|JQuery} el
 */
function spinner(el) {
    el = $(el);
    el.html('<div class="spinner">' +
        '<div class="bounce1"></div>' +
        '<div class="bounce2"></div>' +
        '<div class="bounce3"></div>' +
        '</div>');
}

/**
 * Show a note message on top
 * @param {string} message
 * @param {string=} type
 * @param {number=} delay
 */
function note(message, type, delay) {
    if (delay === -1) delay = 99999999;
    $.notify({
        "message": t(message)
    }, {
        "type": typeof type == "undefined" ? "info" : type,
        placement: {
            from: "top",
            align: "center"
        },
        "delay": delay || 5000,
    });
}

/**
 * Initialize all collapsables in given container
 * @param {JQuery} container
 */
function collapsable(container) {
    container.find(".collapsable-trigger").not("activated").addClass("activated").trigger("collapsable-init");
}

/**
 * Initialize all textarea autoheights
 * @param {JQuery} container
 */
function textareaAutoheight(container) {
    container.find('textarea.autoheight').not(".autoheight-activated").each(function () {
        this.setAttribute('style', 'height:' + (Math.max(20, this.scrollHeight)) + 'px;overflow-y:hidden;');
    }).addClass("autoheight-activated").on('input focus', function () {
        this.style.height = 'auto';
        this.style.height = (Math.max(20, this.scrollHeight)) + 'px';
    }).triggerHandler("input");
}

/**
 * Get url query parameter
 * @param {string} key
 * @return {string|null}
 */
function get(key) {
    if (!location.search) return null;
    var m = location.search.match(new RegExp(key + "=([^\&]*)"));
    if (!m) return null;
    return m[1];
}

$(function () {
    if (typeof WebSocket == "undefined") {
        note("Your browser is not supported in this application (Outdated Browser). Please upgrade to the newest version");
        return;
    }
    // do some hamburger and navigation magic
    (function () {
        var trigger = $('.hamburger'),
            overlay = $('.overlay'),
            isClosed = false;

        trigger.click(function () {
            hamburger_cross();
        });

        function hamburger_cross() {

            if (isClosed == true) {
                overlay.hide();
                trigger.removeClass('is-open');
                trigger.addClass('is-closed');
                isClosed = false;
            } else {
                overlay.show();
                trigger.removeClass('is-closed');
                trigger.addClass('is-open');
                isClosed = true;
            }
        }

        $('[data-toggle="offcanvas"]').click(function () {
            $('#wrapper').toggleClass('toggled');
        });
    })();
    var body = $("body");
    var hasTouch = true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
    body.addClass(hasTouch ? "no-touch" : "touch");
    // bind tooltips
    $(document).tooltip({
        "selector": '[data-tooltip]',
        "container": "body",
        "html": true,
        "title": function () {
            return t($(this).attr("data-tooltip"));
        }
    }).on("inserted.bs.tooltip", function (ev) {
        // hide if we are on mobile touch device
        if (hasTouch) {
            setTimeout(function () {
                $(ev.target).trigger("mouseout");
            }, 1000);
        }
    }).on("click collapsable-init", ".collapsable-trigger", function (ev) {
        var e = $(this);
        var targetId = e.attr("data-collapsable-target");
        var target = $(".collapsable-target").filter("[data-collapsable-id='" + targetId + "']");
        if (target.length) {
            if (ev.type != "collapsable-init") {
                e.toggleClass("collapsed");
                target.toggleClass("collapsed");
                Storage.set("collapsable." + targetId, target.hasClass("collapsed"));
            } else {
                // collapsed is stored or initially collapsed
                var flag = Storage.get("collapsable." + targetId) || target.hasClass("collapsed") || false;
                e.toggleClass("collapsed", flag);
                target.toggleClass("collapsed", flag);
            }
        }
    });
    collapsable(body);
    lang.replaceInHtml(body);
    Socket.connectAndLoadView();
});

$(window).on("popstate", function (ev) {
    // if the state is the page you expect, pull the name and load it.
    if (ev.originalEvent.state && ev.originalEvent.state.url) {
        View.loadUrl(ev.originalEvent.state.url);
    }
});

// delegate events
$(document).on("click", ".page-link", function (ev) {
    ev.stopPropagation();
    ev.preventDefault();
    $(".hamburger.is-open").trigger("click");
    View.loadUrl($(this).attr("href"));
});