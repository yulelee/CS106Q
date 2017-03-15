'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');

var dataBaseHandler = {};

var parseDate = function(buckets, callback) {
	async.each(buckets, function(bucket, finishOneBucket) {
		bucket.date_time = new Date(bucket.date_time).toLocaleString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour12: true, 
			hour: "2-digit", 
			minute: "2-digit"
		});
		finishOneBucket();
	}, function(err) {
		if (err) { res.status(400).send('Error attaching date strings, final.'); }
		else { callback(); }
	});
};

dataBaseHandler.searchSuidHistory = function(req, res) {
	Bucket.find({studentSuids: req.query.suid}, function(err, buckets) {
		if (err) { res.status(400).send('Error finding buckets.'); } 
		else { 
			var buckets = JSON.parse(JSON.stringify(buckets));
			parseDate(buckets, function() {
				res.status(200).send(JSON.stringify(buckets));
			});
		}
	});
};

dataBaseHandler.searchDescriptionKeyWordsHistory = function(req, res) {
	Bucket.find({description: {$regex: req.query.keyword, $options: 'si'}}, function(err, buckets) {
		if (err) { res.status(400).send('Error finding buckets.'); }
		else { 
			var buckets = JSON.parse(JSON.stringify(buckets));
			parseDate(buckets, function() {
				res.status(200).send(JSON.stringify(buckets));
			});
		}
	});
};

module.exports = dataBaseHandler;