"use strict";
/**
 * Translations
 */

var lang = {};

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
lang.get = function (key, params) {
    var v = key;
    if (typeof lang.values[lang.language] != "undefined" && typeof lang.values[lang.language][key] != "undefined") {
        v = lang.values[lang.language][key];
    } else if (typeof lang.values["en"] != "undefined" && typeof lang.values["en"][key] != "undefined") {
        v = lang.values["en"][key];
    }
    if (typeof params != "undefined") {
        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                v = v.replace(new RegExp("{" + i + "}", "ig"), params[i]);
            }
        }
    }
    return v;
};

/**
 * Replace all placeholders in html with proper translation values
 * @param {JQuery} el The element to replace values in
 */
lang.replaceInHtml = function (el) {
    var get = lang.get;
    var elements = el.find("[data-translate]");
    elements.each(function () {
        $(this).html(get($(this).attr("data-translate")));
    });
    elements.removeAttr("data-translate");
    elements = el.find("[data-translate-property]");
    elements.each(function () {
        var s = $(this).attr("data-translate-property").split(",");
        $(this).attr(s[0], get(s[1]));
    });
    elements.removeAttr("data-translate-property");
};

/**
 * The translation values
 * @type {object.<string, object<string, string>>}
 */
lang.values = {"en": {}, "de": {}};

// en values
lang.values.en = {
    "users.title" : "Users",
    "users.username.title": "Username",
    "users.password.title": "Password",
    "users.password2.title": "Password repeat",
    "users.admin.title": "Administrator",
    "users.admin.sub": "The user with all permissions",
    "settings.title" : "Settings",
    "settings.default_placeholder" : "Found at {cmd}, click save to accept this defaults",
    "settings.steamcmd.title" : "SteamCMD path",
    "settings.steamcmd.sub" : "Some servers (Rust, CSGO, ...) require this program to be installed. Run '{install}' in the command line to install this program",
    "settings.tar.title" : "TAR path",
    "settings.tar.sub" : "To unpack some server files. It's default installed on most OS. Run '{install}' in the command line to install this program",
    "settings.unzip.title" : "Unzip path",
    "settings.unzip.sub" : "To unpack some server files. It's default installed on most OS. Run '{install}' in the command line to install this program",
    "servers.title" : "Servers",
    "servers.info" : "Here you can create a complete new game server. You manage all required server configuration values here. Installation, wipe, update, console, etc... is than available in the dashboard.",
    "servers.form" : "Serverdata",
    "servers.game.title" : "The game",
    "servers.game.sub" : "If you miss a game, goto our github page and create an issue",
    "servers.game.value." : "Choose a game",
    "servers.game.value.rust" : "Rust",
    "servers.game.value.csgo" : "Counterstrike: Go",
    "servers.game.value.factorio" : "Factorio",
    "servers.name.title" : "Name your server",
    "servers.name.sub" : "Just used for this interface and the dashboard, not in-game specific",
    "servers.factorio[port].title" : "Port",
    "servers.factorio[branch].title" : "Branch",
    "servers.factorio[branch].value.stable" : "Stable",
    "servers.factorio[branch].value.experimental" : "Experimental",
    "servers.factorio[name].title" : "Name of your server in the games serverbrowser",
    "servers.factorio[description].title" : "Server description",
    "servers.factorio[rcon_port].title" : "RCON Port",
    "servers.factorio[rcon_port].sub" : "0 means no RCON",
    "servers.factorio[rcon_password].title" : "RCON Password",
    "servers.factorio[tags].title" : "Server tags",
    "servers.factorio[tags].sub" : "Just some tags that show up in the serverbrowser. Split multiple by space.",
    "servers.factorio[max_players].title" : "Max. Players",
    "servers.factorio[max_players].sub" : "Maximum number of players allowed, admins can join even a full server. 0 means unlimited.",
    "servers.factorio[visibility].title" : "Visibility",
    "servers.factorio[visibility].sub" : "Where to publish the server",
    "servers.factorio[visibility].value.public" : "public: Game will be published on the official Factorio matching server",
    "servers.factorio[visibility].value.lan" : "lan: Game will be broadcast on LAN",
    "servers.factorio[username].title" : "Factorio.com Username",
    "servers.factorio[username].sub" : "Your factorio.com login credentials. Required for games with visibility public",
    "servers.factorio[password].title" : "Factorio.com Password",
    "servers.factorio[password].sub" : "Your factorio.com login credentials. Required for games with visibility public",
    "servers.factorio[token].title" : "Factorio.com Auth Token",
    "servers.factorio[token].sub" : "Authentication token. May be used instead of 'password' above.",
    "servers.factorio[game_password].title" : "Game password",
    "servers.factorio[game_password].sub" : "If set, only users with the password can join the server",
    "servers.factorio[admins].title" : "Game admins",
    "servers.factorio[admins].sub" : "Name your admins by username, split multiple by comma, case insensitive",
    "servers.factorio[require_user_verification].title" : "Require user verification",
    "servers.factorio[require_user_verification].sub" : "When activated, the server will only allow clients that have a valid Factorio.com account",
    "servers.factorio[max_upload_in_kilobytes_per_second].title" : "Max. Upload in kB/s",
    "servers.factorio[max_upload_in_kilobytes_per_second].sub" : "0 means not limit",
    "servers.factorio[minimum_latency_in_ticks].title" : "Minimum latency in ticks",
    "servers.factorio[minimum_latency_in_ticks].sub" : "One tick is 16ms in default speed. 0 means no minimum.",
    "servers.factorio[ignore_player_limit_for_returning_players].title" : "Known players can always join",
    "servers.factorio[ignore_player_limit_for_returning_players].sub" : "Players that played on this map already can join even when the max player limit was reached.",
    "servers.factorio[allow_commands].title" : "Allow server commands for",
    "servers.factorio[allow_commands].value.true" : "All",
    "servers.factorio[allow_commands].value.admins-only" : "Admins only",
    "servers.factorio[allow_commands].value.false" : "Nobody",
    "servers.factorio[autosave_interval].title" : "Autosave interval in minutes",
    "servers.factorio[autosave_slots].title" : "Autosave slots",
    "servers.factorio[autosave_slots].sub" : "It is cycled through when the server autosaves.",
    "servers.factorio[afk_autokick_interval].title" : "AFK Autokick",
    "servers.factorio[afk_autokick_interval].sub" : "How many minutes until someone is kicked when doing nothing, 0 for never.",
    "servers.factorio[auto_pause].title" : "Auto pause",
    "servers.factorio[auto_pause].sub" : "Whether should the server be paused when no players are present.",
    "servers.factorio[only_admins_can_pause_the_game].title" : "Only admins can pause the game",
    "servers.factorio[autosave_only_on_server].title" : "Autosave only on server",
    "servers.factorio[autosave_only_on_server].sub" : "Whether autosaves should be saved only on server or also on all connected clients.",
    "yes": "Yes",
    "no": "No",
    "save": "Save",
    "saved": "Saved",
    "access.denied": "Accesss denied",
    "users.missing.admin": "At least one administrator must exist",
    "users.error.pwmatch": "Passwords did not match",
    "login.title" : "Welcome",
    "login.success": "Welcome",
    "login.failed": "Login failed",
    "login.username.title": "Username",
    "login.password.title": "Password",
    "login.remember.title": "Remember me",
    "index.pickserver" : "Pick server",
    "index.install.info" : "Update your server to the latest available patch. This will shutdown your server and you have to restart it manually after the update. Run this also when your server is complete new and requires first installation",
    "index.btn.update" : "Update server",
    "index.update-server.confirm": "Make sure to always have a backup before doing this. Server will shutdown and you have to restart it manually when the update is done.",
    "index.update-server.scheduled" : "The update is now in progress. This may take a while, the status information is available in the console. You will see a success message after the update is done.",
    "index.start-server.scheduled" : "Server start scheduled. You will see the status information in the console",
    "index.stop-server.scheduled" : "Server stop scheduled. You will see the status information in the console",
    "index.start-server.confirm" : "Just for confirmation, are you sure?",
    "index.stop-server.confirm" : "Just for confirmation, are you sure? Server will shutdown immediately",
    "index.start-server" : "Start",
    "index.stop-server" : "Stop",
    "index.console.autoscroll.enabled" : "Automatic scroll",
    "index.console.autoscroll.disabled" : "Manual scroll",
    "index.input.console" : "Send a command to the server, only work if server is running",
    "index.factorio.maps.info" : "Create and manage all factorio maps. You must have one active map to be able to start the server.",
    "factoriomaps.map.value.none" : "None",
    "factoriomaps.map.value.very-low" : "Very low",
    "factoriomaps.map.value.low" : "Low",
    "factoriomaps.map.value.normal" : "Normal",
    "factoriomaps.map.value.high" : "High",
    "factoriomaps.map.value.very-high" : "Very high",
    "factoriomaps.id.title" : "Map ID",
    "factoriomaps.id.sub" : "A-Z, 0-9, _ and - are allowed. Choose what you like",
    "factoriomaps.active.title" : "Is active map",
    "factoriomaps.active.sub" : "If you activate it, the other current active map will marked as inactive, if exist",
    "factoriomaps.width.title" : "Map width",
    "factoriomaps.width.sub" : "0 for unlimited",
    "factoriomaps.height.title" : "Map height",
    "factoriomaps.height.sub" : "0 for unlimited",
    "factoriomaps.peaceful_mode.title" : "Peaceful mode",
    "factoriomaps.peaceful_mode.sub" : "Enemies will not attack first when activated",
    "factoriomaps.water.title" : "Water",
    "factoriomaps.terrain_segmentation.title" : "Terrain segmentation",
    "factoriomaps.starting_area.title" : "Starting area",
    "factoriomaps.resource.title" : "{resource} | Frequency / Size / Richness",
    "factoriomaps.resource.coal" : "Coal",
    "factoriomaps.resource.copper-ore" : "Copper ore",
    "factoriomaps.resource.crude-oil" : "Crude oil",
    "factoriomaps.resource.enemy-base" : "Enemy Base",
    "factoriomaps.resource.iron-ore" : "Iron ore",
    "factoriomaps.resource.stone" : "Stone",
    "factoriomaps.delete" : "Are you sure? The server will shutdown, if this is the active map, and you have to start em manually again!",
    "index.factorio.map.deletion-scheduled" : "Map will be deleted now. Maybe the server shutdown during this progress. You will see all status messages in the console",
    "index.factorio.map.saved" : "Map saved",
    "index.factorio.map.exist" : "Map id already exist, nothing save",
    "missing.requirements" : "Required '{app}' to be configured properly but seems to not work as intended. Goto settings for configuration",
    "logout.success": "Bye",
    "edit": "Edit",
    "delete" : "Delete",
    "entries" : "Entries",
    "sure" : "Are you sure?",
    "modal.title.confirm" : "Confirmation",
    "modal.accept" : "Accept",
    "modal.cancel" : "Cancel"
};

// de values
lang.values.de = {};

/**
 * The current language, default to en
 * @type {string}
 */
lang.language = "en";

// check for a other supported language depending on the users defined languages
if (navigator.languages) {
    (function () {
        for (var i = 0; i < navigator.languages.length; i++) {
            var l = navigator.languages[i];
            if (typeof lang.values[l] != "undefined") {
                lang.language = l;
                break;
            }
        }
    })();
}