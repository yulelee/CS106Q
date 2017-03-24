'use strict';

var async = require('async');

var SL = require('../schema/sl.js');
var clientList = require('./clientList.js');
var Bucket = require('../schema/bucket.js');
var MongoStore = require('connect-mongo');
var session = require('express-session');

var SlHandler = require('./sl.js');
var GeneralUtil = require('./util.js');

var slLoginHandler = {};

slLoginHandler.slLoginCheck = function(req, res, next) {
    SL.findOne({suid: req.session.slSuid, _id: req.session.sl_id}, function(err, userInSess) {
        if (err) {res.status(400).send('Error.');}
        else {
            if (userInSess && userInSess.logged_in_sessionId && userInSess.logged_in_sessionId === req.session.id) {next();}
            else {res.status(401).send('Unauthorized.');}
        }
    });
};

var checkValidateSuid = function(suid) {
    return SL.findOne({suid: suid}).exec().then(function(sl) {
        if (sl) { return sl; }
        else { throw 'SUID not found!'; }
    });
};

slLoginHandler.slLogin = function(req, res) {
    checkValidateSuid(req.body.suid)
    .then(clientList.forceLogout)
    .then(function(sl) {
        req.session.sl_id = sl._id;
        req.session.slSuid = req.body.suid;
        sl.logged_in_sessionId = req.session.id;
        return sl.save().then(req.save);
    }).then(GeneralUtil.parseCopy)
    .then(SlHandler.attachBucket)
    .then(function(sl) {
        res.status(200).send(JSON.stringify(sl));
        clientList.broadcastChange();
    }).catch(function(err) {
        res.status(400).send(err);
    });
};

slLoginHandler.slLogout = function(req, res) {
    SL.findOne({suid: req.session.slSuid, _id: req.session.sl_id}).exec().then(function(sl) {
        sl.logged_in_sessionId = undefined;
        return sl.save;
    }).then(function() {
        req.session.sl_id = undefined;
        req.session.slSuid = undefined;
        return req.save;
    }).then(function() {
        res.status(200).send('Success.');
        clientList.broadcastChange();
    }).catch(function(err) {
        res.status(400).send(err);
    });
};

module.exports = slLoginHandler;
