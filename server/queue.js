'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');

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
	                else {
	                	clientList.broadcastChange();
	                	res.status(200).end(JSON.stringify(bucket));
	                }
	            });
	        }
	    }
	});
};

queueHandler.getCurrentList = function(req, res) {
	Bucket.find().sort({'date_time': -1}).exec(function(err, buckets) {
	    if (err) {res.status(400).send('Error retrieving buckets.');}
	    else {
	    	var list = JSON.parse(JSON.stringify(buckets));
	    	async.each(list, function(bucket, finishOneBucket) {
	    	    bucket.date_time = new Date(bucket.date_time).toLocaleString();
	    	    finishOneBucket();
	    	}, function(err) {
	    	    if (err) {response.status(400).end('Error processing buckets, final');}
	    	    else {res.end(JSON.stringify(list));}
	    	});
	    }
	});
};

queueHandler.deleteBucket = function(req, res) {
	Bucket.find({'_id': req.body.bucketId}, function (err, bucket) {
		if (err) {res.status(400).send('Error bucket not existing.');}
		else {
			console.log(bucket);
			console.log(req.body.bucketId);
			Bucket.find({'_id': req.body.bucketId}).remove(function() {
				clientList.broadcastChange();
				res.status(200).send('Deleted.');
			});
		}
	});
};

module.exports = queueHandler;