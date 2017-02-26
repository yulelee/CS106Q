'use strict';

var async = require('async');

var SL = require('../schema/sl.js');
var clientList = require('./clientList.js');

var slLoginHandler = {};

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

module.exports = slLoginHandler;