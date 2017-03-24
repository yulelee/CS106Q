'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');
var DatetimeUtils = require('./datetimeUtils.js');
var MessageHandler = require('./message.js');
var GeneralUtil = require('./util.js');

var dataBaseHandler = {};

dataBaseHandler.searchSuidHistory = function(req, res) {
	Bucket.find({studentSuids: req.query.suid}).sort({'data_time': -1}).exec()
	.then(GeneralUtil)
	.then(DatetimeUtils.parseDate)
	.then(function(buckets) {
		res.status(200).send(JSON.stringify(buckets));
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

dataBaseHandler.searchDescriptionKeyWordsHistory = function(req, res) {
	Bucket.find({description: {$regex: req.query.keyword, $options: 'si'}}).sort({'date_time': -1}).exec()
	.then(GeneralUtil)
	.then(DatetimeUtils.parseDate)
	.then(function(buckets) {
		res.status(200).send(JSON.stringify(buckets));
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

dataBaseHandler.searchMessageKeyWordsHistory = function(req, res) {
	Message.find({content: {$regex: req.query.keyword, $options: 'si'}}).sort({'date_time': -1}).exec()
	.then(GeneralUtil.parseCopy)
	.then(MessageHandler.attachSLandBucket)
	.then(DatetimeUtils.parseDate)
	.then(function(messages) {
		res.status(200).send(JSON.stringify(messages));
	}).catch(function(err) {
		res.status(200).send(err);
	});
};

module.exports = dataBaseHandler;