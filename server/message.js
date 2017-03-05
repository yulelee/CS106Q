'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');

var messageHandler = {};

messageHandler.getMessageList = function(req, res) {
	SL.findOne({_id: req.session.sl_id}, function(err, sl) {
		if (err) { res.status(400).send('Error finding the sl.'); }
		else {
			var unreadMessages = [];
			async.each(sl.unreadMessages, function(message, finishOneMessage) {
				Message.findOne({_id: message}, function(err, message) {
					if (err) { res.status(400).send('Error finding the message from id.'); }
					else {
						message = (JSON.parse(JSON.stringify(message)));
						SL.findOne({_id: message.slPoster}, function(err, sl) {
							if (err) { res.status(400).send('Error finding sl.'); }
							else {
								message.slPoster = JSON.parse(JSON.stringify(sl));
								Bucket.findOne({_id: message.associatedBucket}, function(err, bucket) {
									if (err) { res.status(400).send('Error finding bucket.'); }
									else {
										message.associatedBucket = JSON.parse(JSON.stringify(bucket));
										unreadMessages.push(message);
										finishOneMessage();
									}
								});
							}
						});
					}
				});
			}, function(err) {
				if (err) { res.status(400).send('Error find messages, final.'); }
				else {
					unreadMessages.sort(function(a, b) {
						return new Date(b.date_time) - new Date(a.date_time);
					});
					res.status(200).send(JSON.stringify(unreadMessages));
				}
			});
		}
	});
};

messageHandler.dismissMessage = function(req, res) {
	SL.findOne({_id: req.session.sl_id}, function(err, sl) {
		var index = sl.unreadMessages.indexOf(req.body.message_id);
		if (index < 0) { res.status(400).send('Not in your list now.'); }
		else {
			sl.unreadMessages.splice(index, 1);
			sl.save(function(err) {
				if (err) { res.status(400).send('Error saving sl'); }
				else {
					res.status(200).send('Deleted.'); 
					clientList.broadcastChange();
				}
			});
		}
	});
};


// deprecated one, when the message saved a list of users that has deleted it
messageHandler.getMessageList_deprecated = function(req, res) {
	Message.find({hasDeleted: {$ne: req.session.sl_id}}).sort({'date_time': -1}).limit(30).exec(function(err, messages) {
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

// deprecated one, when the message saved a list of users that has deleted it
messageHandler.dismissMessage_deprecated = function(req, res) {
	Message.findOne({_id: req.body.message_id}, function(err, message) {
		if (err) { res.status(400).send('Error finding messages.'); }
		else {
			if (message.hasDeleted.indexOf(req.session.sl_id) >= 0) {
				res.status(400).send('Already dismissed.');
			}
			else {
				message.hasDeleted.push(req.session.sl_id);
				message.save(function(err) {
					if (err) { res.status(400).send('Error when saving the message'); }
					else { 
						res.status(200).send('Deleted.'); 
						clientList.broadcastChange();
					}
				});
			}
		}
	});
};

module.exports = messageHandler;