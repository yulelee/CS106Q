'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');
var DatetimeUtils = require('./datetimeUtils.js');

var dataBaseHandler = {};

dataBaseHandler.searchSuidHistory = function(req, res) {
	Bucket.find({studentSuids: req.query.suid}, function(err, buckets) {
		if (err) { res.status(400).send('Error finding buckets.'); } 
		else { 
			var buckets = JSON.parse(JSON.stringify(buckets));
			DatetimeUtils.parseDate(buckets, function(err) {
				if (err) { res.status(200).send(err); }
				else { res.status(200).send(JSON.stringify(buckets)); }
			});
		}
	});
};

dataBaseHandler.searchDescriptionKeyWordsHistory = function(req, res) {
	Bucket.find({description: {$regex: req.query.keyword, $options: 'si'}}, function(err, buckets) {
		if (err) { res.status(400).send('Error finding buckets.'); }
		else { 
			var buckets = JSON.parse(JSON.stringify(buckets));
			DatetimeUtils.parseDate(buckets, function(err) {
				if (err) { res.status(200).send(err); }
				else { res.status(200).send(JSON.stringify(buckets)); }
			});
		}
	});
};

dataBaseHandler.searchMessageKeyWordsHistory = function(req, res) {
	Message.find({content: {$regex: req.query.keyword, $options: 'si'}}, function(err, messages) {
		if (err) { res.status(400).send('Error finding messages.'); }
		else {
			var messages = JSON.parse(JSON.stringify(messages));
			DatetimeUtils.parseDate(messages, function(err) {
				if (err) { res.status(200).send(err); }
				else { res.status(200).send(JSON.stringify(messages)); }
			});
		}
	});
};

module.exports = dataBaseHandler;