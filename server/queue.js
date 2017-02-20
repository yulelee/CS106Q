'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');

var queueHandler = {};

queueHandler.putNew = function(req, res) {
	Bucket.findOne({studentSuids: req.body.suid}, "_id", function(err, userExisted) {
	    if (err) {res.status(400).end('Error checking existing SUID.');}
	    else {
	        if (userExisted) {res.status(400).end('SUID already existed.');}
	        else {
	            var bucket = new Bucket({ 
	            	type: req.body.type,
	            	description: req.body.description, 
	            	class: req.body.class,
	            	students: [req.body.studentName],
	            	studentSuids: [req.body.suid],
	            	helperSL: undefined
	            });
	            bucket.save(function(err, bucket) {
	                if (err) {res.status(400).end('Error saving new bucket.');}
	                else {res.status(200).end(JSON.stringify(bucket));}
	            });
	        }
	    }
	});
};

module.exports = queueHandler;