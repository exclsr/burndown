// Routes for settings

var express = require('express');
var router = express.Router();

var ensure = require('circle-blvd/auth-ensure');
var send   = require('circle-blvd/send');
var handle = require('circle-blvd/handle');

module.exports = function (db) {
    var settings = require('circle-blvd/settings')(db);

    // caching middleware
    var cache = function (ms) {
        var fn = function (req, res, next) {
            res.setHeader("Cache-Control", "max-age=" + ms);
            next();
        };
        return fn;
    };

    // TODO: Is this really six minutes?
    var sixMinutes = 5 * 60;

    // Get public settings
    router.get("/", cache(sixMinutes), send(db.settings.get)); 

    // Get settings that can be edited by mainframe admins
    router.get("/authorized", ensure.mainframe, send(db.settings.getAuthorized));

    // Save a setting
    router.put("/setting", ensure.mainframe, function (req, res) {
        var data = req.body;
        settings.update(data, handle(res));
    });

    // TODO: This is not used. Assess.
    router.get("/private", ensure.mainframe, send(db.settings.getPrivate)); 

    return {
        router: router
    };
};