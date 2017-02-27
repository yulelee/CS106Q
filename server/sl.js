'use strict';

var async = require('async');

var SL = require('../schema/sl.js');
var clientList = require('./clientList.js');

var slHandler = {};

slHandler.getCurSLlist = function(req, res) {
    SL.find({logged_in_sessionId: {$ne : undefined}}, function(err, curSLs) {
        if (err) { res.status(400).send('Error.'); }
        else { res.status(200).send(JSON.stringify(curSLs)); }
    });
};

module.exports = slHandler;