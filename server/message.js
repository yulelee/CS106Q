'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');

var messageHandler = {};

messageHandler.getMessageList = function(req, res) {
	Message.find({}).sort({'date_time': -1}).limit(30).exec(function(err, messages) {
		if (err) { res.status(400).send('Error finding messages.'); }
		else {
			messages = JSON.parse(JSON.stringify(messages));
			async.each(messages, function(message, finishOneMessage) {
				SL.findOne({_id: message.slPoster}, function(err, sl) {
					if (err) { res.status(400).send('Error finding sl.'); }
					else {
						message.slPoster = JSON.parse(JSON.stringify(sl));
						Bucket.findOne({_id: message.associatedBucket}, function(err, bucket) {
							if (err) { res.status(400).send('Error finding bucket.'); }
							else {
								message.associatedBucket = JSON.parse(JSON.stringify(bucket));
								finishOneMessage();
							}
						});
					}
				});
			}, function(err) {
				if (err) { res.status(400).send('Error processing messages, final.'); }
				else {
					res.status(200).send(JSON.stringify(messages));
				}
			});
		}
	});
};

module.exports = messageHandler;