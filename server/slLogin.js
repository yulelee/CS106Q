'use strict';

var async = require('async');

var SL = require('../schema/sl.js');
var clientList = require('./clientList.js');
var Bucket = require('../schema/bucket.js');
var MongoStore = require('connect-mongo');
var session = require('express-session');

var slHandler = require('./sl.js');

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

var removeOldSession = function(store, session_id, res) {
    return new Promise(function(resolve, reject) {
        store.destroy(session_id, function(err) {
            if (err) { reject(err); }
            else {
                resolve();
                clientList.broadcastChange();
            }
        });
    });
};

slLoginHandler.slLogin = function(req, res) {
    SL.findOne({suid: req.body.suid}).exec().then(function(sl) {
        if (!sl) { reject('SUID not found!'); return; }
        var oldLoggedInSessionId = sl.logged_in_sessionId !== req.session.id ? sl.logged_in_sessionId : undefined;
        req.session.sl_id = sl._id;
        req.session.slSuid = req.body.suid;
        sl.logged_in_sessionId = req.session.id;
        Promise.all([sl.save(), req.session.save()]).then(function() {
            sl = JSON.parse(JSON.stringify(sl));
            slHandler.attachBucket(sl).then(function() {
                res.status(200).send(JSON.stringify(sl));
                clientList.broadcastChange();
                clientList.forceLogout(oldLoggedInSessionId);
            });
        });
    }).catch(function(err) {
        res.status(400).send(err);
    });
};

slLoginHandler.slLogout = function(req, res) {
    SL.findOne({suid: req.session.slSuid, _id: req.session.sl_id}, function(err, sl) {
        if (err) {res.status(400).send('Error.');}
        else {
            if (sl && sl.logged_in_sessionId && sl.logged_in_sessionId === req.session.id) {
                sl.logged_in_sessionId = undefined;
                sl.save(function() {
                    req.session.sl_id = undefined;
                    req.session.slSuid = undefined;
                    req.session.save(function() {
                        res.status(200).send('logged out successfully.');
                        clientList.broadcastChange();
                    });
                });
            }
            else {
                res.status(400).send('User not logged in or not found.');
            }
        }
    });
};

module.exports = slLoginHandler;
