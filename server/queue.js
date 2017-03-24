'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');
var DatetimeUtils = require('./datetimeUtils.js');

var messageHandler = require('./message.js');
var GeneralUtil = require('./util.js');

var queueHandler = {};

var averageHelpingTime = 20.0; // 20 min

var computeRemainingTime = function(waitingBucketCount) {
	return new Promise(function(resolve, reject) {
		SL.count({logged_in_sessionId: {$ne : undefined}}).exec().then(function(loggedInSlCount) {
			var waitingTime = waitingBucketCount * averageHelpingTime / Math.max(1, loggedInSlCount); // time for the buckets still waiting
			Bucket.find({helperSL: {$ne : undefined}, solved: false}).sort({helpStartTime: -1}).limit(1).exec().then(function(newestStartedHelpedBucket) {
				var needTime = newestStartedHelpedBucket.length === 0 ? 0 : (averageHelpingTime - ((new Date()) - newestStartedHelpedBucket[0].helpStartTime) / 1000 / 60); // time needed to end this one
				needTime = Math.max(0, needTime);
				waitingTime += needTime;
				resolve(waitingTime);
			});
		}).catch(function(err) { reject(err); });
	});
};

queueHandler.getCurInfo = function(req, res) {
	var info = {};
	Bucket.count({helperSL: undefined}).exec().then(function(waitingBucketCount) {
		info.waitingBucketCount = waitingBucketCount;
		computeRemainingTime(waitingBucketCount).then(function(waitingTime) {
			info.waitingTime = waitingTime;
			res.status(200).send(JSON.stringify(info));
		});
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

// one person cannot have more than one on-going buckets
var validateExistingBucket = function(suid) {
	return new Promise(function(resolve, reject) {
		Bucket.findOne({studentSuids: suid}, "_id").exec().then(function(bucket) {
			if (bucket) { reject('Error checking existing SUID.'); }
			else { resolve(); }
		});
	});
};

queueHandler.insertNew = function(req, res) {
	validateExistingBucket(req.body.suid)
	.then(() => Bucket.findOne({_id: req.body._id}).exec())
	.then((bucket) => new Promise(function(resolve, reject) {
		bucket.students.push(req.body.studentName);
		bucket.studentSuids.push(req.body.suid);
		bucket.save().then(resolve);
	})).then(function() {
		res.status(200).end('Success.');
		clientList.broadcastChange();
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

queueHandler.putNew = function(req, res) {
	validateExistingBucket(req.body.suid).then(function() {
		var bucket = new Bucket({ 
			type: req.body.type,
			description: req.body.description, 
			class: req.body.class,
			students: [req.body.studentName],
			studentSuids: [req.body.suid],
			position: req.body.position
		});
		bucket.save().then(function() {
			res.status(200).send('Success.');
			clientList.broadcastChange();
		});
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

queueHandler.attachSL = function(buckets) {
	return new Promise(function(resolve, reject) {
		async.each(buckets, function(bucket, finishOneBucket) {
			SL.findOne({_id: bucket.helperSL}).exec().then(function(sl) {
				bucket.helperSL = JSON.parse(JSON.stringify(sl));
				finishOneBucket();
			});
		}, function(err) {
			if (err) { reject(err); }
			else { resolve(buckets); }
		});
	});
};

var assembleSolved = function() {
	return new Promise(function(resolve, reject) {
		Bucket.find({solved: true}).sort({'helpEndTime': -1}).limit(20).exec()
		.then(GeneralUtil.parseCopy)
		.then(DatetimeUtils.parseDate)
		.then(queueHandler.attachSL)
		.then(function(buckets) {
			resolve(buckets);
		}).catch(function(err) {
			reject(err);
		});
	});
};

var assembleSolving = function() {
	return new Promise(function(resolve, reject) {
		Bucket.find({solved: false, helperSL: {$ne: undefined}}).sort({'helpStartTime': -1}).exec()
		.then(GeneralUtil.parseCopy)
		.then(DatetimeUtils.parseTime)
		.then(queueHandler.attachSL)
		.then(function(buckets) {
			resolve(buckets);
		}).catch(function(err) {
			reject(err);
		});
	});
};

var assemblePending = function() {
	return new Promise(function(resolve, reject) {
		Bucket.find({solved: false, helperSL: undefined}).sort({'date_time': 1}).exec()
		.then(GeneralUtil.parseCopy)
		.then(DatetimeUtils.parseTime)
		.then(function(buckets) {
			resolve(buckets);
		}).catch(function(err) {
			reject(err);
		});
	});
};

queueHandler.getCurrentList = function(req, res) {
	var categorizedList = {};
	Promise.all([assemblePending(), assembleSolving(), assembleSolved()]).then(function(results) {
		categorizedList.waiting = results[0];
		categorizedList.helping = results[1];
		categorizedList.solved = results[2];
		res.status(200).send(JSON.stringify(categorizedList));
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

var markBucketAsResolved = function(bucket_id) {
	return new Promise(function(resolve, reject) {
		Bucket.findOne({_id: bucket_id}).exec().then(function (bucket) {
			bucket.solved = true; // mark resolved
			bucket.helpEndTime = new Date(); // record the end time
			bucket.save().then(function() { resolve(); });
		});
	});
};

var markSlAsFree = function(sl_id) {
	return new Promise(function(resolve, reject) {
		SL.findOne({currently_helping: {$ne: undefined}, _id: sl_id}).exec().then(function(sl) {
			if (!sl.currently_helping) { reject('You are not helping.'); }
			else {
				sl.currently_helping = undefined; // mark sl free
				sl.save().then(function() { resolve(); });
			}
		});
	});
};

queueHandler.solveBucket = function(req, res) {
	markBucketAsResolved(req.body.bucket_id)
	.then(markSlAsFree(req.session.sl_id))
	.then(function() {
		res.status(200).send('Success.');
		clientList.broadcastChange();
		messageHandler.createNewMessage(req.session.sl_id, req.body.message, req.body.bucket_id);
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

// so it seems like no one has touched it
var markBucketAsClean = function(bucket_id) {
	return new Promise(function(resolve, reject) {
		Bucket.findOne({_id: bucket_id}).exec().then(function(bucket) {
			if (!bucket.helperSL) { reject('Error bucket not marked as being helped.'); }
			else {
				bucket.helperSL = undefined;
				bucket.helpStartTime = undefined; // erase the starting time of this help
				bucket.save().then(function () { resolve(); });
			}
		});
	});
};

queueHandler.putBackBucket = function(req, res) {
	markBucketAsClean(req.body.bucket_id)
	.then(markSlAsFree(req.session.sl_id))
	.then(function() {
		res.status(200).send('Success.');
		clientList.broadcastChange();
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

queueHandler.pickBucket = function(req, res) {
	Promise.all([new Promise(function(resolve, reject) {
			SL.findOne({_id: req.session.sl_id}).exec().then(function(sl) {
				if (sl.currently_helping) { reject('Please finish the current one first!'); }
				else { resolve(sl); }
			});
		}), new Promise(function(resolve, reject) {
			Bucket.findOne({_id: req.body.bucket_id}).exec().then(function(bucket) {
				if (bucket.helperSL || bucket.solved) { reject('Please finish pick a new one!'); }
				else { resolve(bucket); }
			});
		})]).then(function(data) {
		var sl = data[0];
		var bucket = data[1];
		bucket.helperSL = sl._id;
		bucket.helpStartTime = new Date(); // record the current time
		bucket.save().then(function() {
			sl.currently_helping = bucket._id;
			sl.save().then(function() {
				res.status(200).send('Success.'); 
				clientList.broadcastChange();
			});
		});
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

module.exports = queueHandler;