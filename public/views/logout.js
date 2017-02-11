"use strict";
View.script = function (message) {
    Storage.set("loginName", null, true);
    Storage.set("loginHash", null, true);
    Storage.set("loginName", null, false);
    Storage.set("loginHash", null, false);
    location.href = "/index";
};