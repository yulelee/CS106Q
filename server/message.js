'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');
var DatetimeUtils = require('./datetimeUtils.js');

var messageHandler = {};

// assuming the argument messages is already being parsed, so its writable
messageHandler.attachSL = function(messages) {
	return new Promise(function(resolve, reject) {
		async.each(messages, function(message, finishOneMessage) {
			SL.findOne({_id: message.slPoster}, "-logged_in_sessionId -unreadMessages").exec().then(function(sl) {
				message.slPoster = JSON.parse(JSON.stringify(sl));
				finishOneMessage();
			});
		}, function(err) {
			if (err) { reject(err); }
			else { resolve(messages); }
		});
	});
};

messageHandler.attachBucket = function(messages, callback) {
	return new Promise(function(resolve, reject) {
		async.each(messages, function(message, finishOneMessage) {
			if (!message.associatedBucket) { finishOneMessage(); return; }
			Bucket.findOne({_id: message.associatedBucket}).exec().then(function(bucket) {
				message.associatedBucket = JSON.parse(JSON.stringify(bucket));
				DatetimeUtils.parseSingleDate(message.associatedBucket).then(finishOneMessage);
			});
		}, function(err) {
			if (err) { reject(err); }
			else { resolve(messages); }
		});
	});
};

messageHandler.attachSLandBucket = function(messages, callback) {
	return new Promise(function(resolve, reject) {
		messageHandler.attachSL(messages)
		.then(messageHandler.attachBucket)
		.then(function(messages) {
			resolve(messages);
		}).catch(function(err) {
			reject(err);
		});
	});
};

// use the sl, and get the whole list of actual unread messages for him/her
var getUnreadMessages = function(sl) {
	return new Promise(function(resolve, reject) {
		var unreadMessages = [];
		async.each(sl.unreadMessages, function(message, finishOneMessage) {
			Message.findOne({_id: message}).exec().then(function(message) {
				unreadMessages.push(JSON.parse(JSON.stringify(message)));
				finishOneMessage();
			});
		}, function(err) {
			if (err) { reject(err); }
			else { resolve(unreadMessages); }
		});
	});
};

messageHandler.getMessageList = function(req, res) {
	SL.findOne({_id: req.session.sl_id}).exec()
	.then(getUnreadMessages)
	.then(DatetimeUtils.sortNewestFirst)
	.then(DatetimeUtils.parseDate)
	.then(messageHandler.attachSLandBucket)
	.then(function(unreadMessages) {
		res.status(200).send(JSON.stringify(unreadMessages));
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

messageHandler.dismissMessage = function(req, res) {
	SL.findOne({_id: req.session.sl_id}).exec().then(function(sl) {
		var index = sl.unreadMessages.indexOf(req.body.message_id);
		if (index < 0) { res.status(400).send('Not in your list now.'); }
		else {
			sl.unreadMessages.splice(index, 1);
			sl.save().then(function() {
				res.status(200).send('Deleted.'); 
				clientList.broadcastChange();
			});
		}
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

messageHandler.dismissAllMessages = function(req, res) {
	SL.findOne({_id: req.session.sl_id}).exec().then(function(sl) {
		sl.unreadMessages.splice(0, sl.unreadMessages.length);
		sl.save().then(function() {
			res.status(200).send('Deleted.'); 
			clientList.broadcastChange();
		});
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

// these messages does not reply on a particular question bucket
messageHandler.addMessageOutOfNowhere = function(req, res) {
	messageHandler.createNewMessage(req.session.sl_id, req.body.message)
	.then(function() {
		res.status(200).send('Message added!');
		clientList.broadcastChange();
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

var broadCastMessage = function(message) {
	return new Promise(function(resolve, reject) {
		SL.find({}).exec().then(function(sls) {
			async.each(sls, function(sl, finishOneSl) {
				sl.unreadMessages.push(message._id);
				sl.save().then(finishOneSl).catch( function() { reject(); } );
			}, function() {
				resolve();
				clientList.broadcastChange();
			});
		});
	});
};

// poster and bucket are both just _id 
messageHandler.createNewMessage = function(poster, content, bucket) {
	return new Promise(function(resolve, reject) {
		if (!content) { resolve(); return; }
		var message = new Message({
			slPoster: poster,
			content: content, 
			associatedBucket: bucket
		});
		message.save().then(broadCastMessage).then(function() { resolve(); }).catch(function() { reject(); });
	});
};

module.exports = messageHandler;