'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');
var DatetimeUtils = require('./datetimeUtils.js');

var messageHandler = {};

messageHandler.attachSL = function(messages, callback) {
	async.each(messages, function(message, finishOneMessage) {
		SL.findOne({_id: message.slPoster}, "-logged_in_sessionId -unreadMessages", function(err, sl) {
			if (err) { callback('Error finding sl.'); }
			else {
				message.slPoster = JSON.parse(JSON.stringify(sl));
				finishOneMessage();
			}
		});
	}, function(err) {
		if (err) { callback('Error attaching sl, final.'); }
		else { callback(); }
	});
};

messageHandler.attachBucket = function(messages, callback) {
	async.each(messages, function(message, finishOneMessage) {
		if (message.associatedBucket) {
			Bucket.findOne({_id: message.associatedBucket}, function(err, bucket) {
				if (err) { callback('Error finding bucket.'); }
				else {
					message.associatedBucket = JSON.parse(JSON.stringify(bucket));
					DatetimeUtils.parseSingleDate(message.associatedBucket, finishOneMessage);
				}
			});
		} else { finishOneMessage(); }
	}, function(err) {
		if (err) { callback('Error attaching bucket, final.'); }
		else { callback(); }
	});
};

messageHandler.attachSLandBucket = function(messages, callback) {
	messageHandler.attachSL(messages, function(err) {
		if (err) { callback(err); }
		else {
			messageHandler.attachBucket(messages, function(err) {
				if (err) {callback(err);}
				else { callback(); }
			});
		}
	});
};

messageHandler.getMessageList = function(req, res) {
	SL.findOne({_id: req.session.sl_id}, function(err, sl) {
		if (err) { res.status(400).send('Error finding the sl.'); }
		else {
			var unreadMessages = [];
			async.each(sl.unreadMessages, function(message, finishOneMessage) {
				Message.findOne({_id: message}, function(err, message) {
					if (err) { res.status(400).send('Error finding the message from id.'); }
					else {
						unreadMessages.push(JSON.parse(JSON.stringify(message)));
						finishOneMessage();
					}
				});
			}, function(err) {
				if (err) { res.status(400).send('Error find messages, final.'); }
				else {
					messageHandler.attachSLandBucket(unreadMessages, function(err) {
						if (err) { res.status(400).send(err); }
						else {
							unreadMessages.sort(function(a, b) { return new Date(b.date_time) - new Date(a.date_time); });
							DatetimeUtils.parseDate(unreadMessages, function(err) {
								if (err) {res.status(400).send(err);}
								else { res.status(200).send(JSON.stringify(unreadMessages)); }
							});
						}
					});
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

messageHandler.dismissAllMessages = function(req, res) {
	SL.findOne({_id: req.session.sl_id}, function(err, sl) {
		sl.unreadMessages.splice(0, sl.unreadMessages.length);
		sl.save(function(err) {
			if (err) { res.status(400).send('Error saving sl'); }
			else {
				res.status(200).send('Deleted.'); 
				clientList.broadcastChange();
			}
		});
	});
};

// these messages does not reply on a particular question bucket
messageHandler.addMessageOutOfNowhere = function(req, res) {
	var message = new Message({ 
		slPoster: req.session.sl_id,
		content: req.body.message, 
		associatedBucket: undefined
	});
	message.save(function(err, savedMessage) {
	    if (err) {res.status(400).end('Error saving new message.');}
	    else {
	    	// add this message to all of the sls
	    	SL.find({}, function(err, sls) {
	    		if (err) {res.status(400).end('Error retrieving all sls.');}
	    		else {
	    			async.each(sls, function(sl, finishOneSl) {
	    				sl.unreadMessages.push(savedMessage._id);
	    				sl.save(function(err) {
	    					if (err) { res.status(400).end('Error saving message to sl.'); }
	    					else { finishOneSl(); }
	    				});
	    			}, function(err) {
	    				if (err) { res.status(400).end('Error saving message to sl, final'); }
	    				else {
	    					res.status(200).send('Message added!');
	    					clientList.broadcastChange();
	    				}
	    			});
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