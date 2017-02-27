'use strict';

var async = require('async');

var SL = require('../schema/sl.js');
var clientList = require('./clientList.js');

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

slLoginHandler.slLogin = function(req, res) {
	if (req.body.suid) {
	    SL.findOne({suid: req.body.suid}, function(err, sl) {
	        if (err) {res.status(400).send('Error.');}
	        else {
	            if (sl) {
                    req.session.sl_id = sl._id;
                    req.session.slSuid = req.body.suid;
                    req.session.save(function() {
                        sl.logged_in_sessionId = req.session.id;
                        sl.save(function() {
                        	console.log(req.session);
                            res.status(200).send(JSON.stringify(sl));
                        });
                    });      
	            } else {
	                res.status(400).send('SUID not found.');
	            }
	        }
	    });
	}
};

slLoginHandler.slLogin = function(req, res) {
	if (req.body.suid) {
	    SL.findOne({suid: req.body.suid}, function(err, sl) {
	        if (err) {res.status(400).send('Error.');}
	        else {
	            if (sl) {
                    req.session.sl_id = sl._id;
                    req.session.slSuid = req.body.suid;
                    req.session.save(function() {
                        sl.logged_in_sessionId = req.session.id;
                        sl.save(function() {
                        	console.log(req.session);
                            res.status(200).send(JSON.stringify(sl));
                        });
                    });      
	            } else {
	                res.status(400).send('SUID not found.');
	            }
	        }
	    });
	}
};

slLoginHandler.slLogout = function(req, res) {
    SL.findOne({suid: req.session.slSuid, _id: req.session.sl_id}, function(err, sl) {
        if (err) {res.status(400).send('Error.');}
        else {
            if (sl && sl.logged_in_sessionId && sl.logged_in_sessionId === req.session.id) {
                sl.logged_in_sessionId = undefined;
                sl.save(function() {
                    req.session.destroy(function() {
                        res.status(200).send('logged out successfully.'); 
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