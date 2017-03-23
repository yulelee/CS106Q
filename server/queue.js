'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');
var DatetimeUtils = require('./datetimeUtils.js');

var messageHandler = require('./message.js');

var queueHandler = {};

var averageHelpingTime = 20.0; // 20 min

queueHandler.getCurInfo = function(req, res) {
	var info = {};
	var curDate = new Date();
	Bucket.count({helperSL: undefined}, function(err, waitingBucketCount) {
		if (err) { res.status(400).end('Error counting unresolved buckets'); }
		else {
			info.waitingBucketCount = waitingBucketCount;
			SL.count({logged_in_sessionId: {$ne : undefined}}, function(err, loggedInSlCount) {
				if (err) { res.status(400).end('Error counting sls'); }
				else {
					info.waitingTime = waitingBucketCount * averageHelpingTime / Math.max(1, loggedInSlCount); // time for the buckets still waiting 
					Bucket.find({helperSL: {$ne : undefined}, solved: false}).sort({helpStartTime: -1}).limit(1).exec(function(err, newestStartedHelpedBucket) {
						var needTime = newestStartedHelpedBucket.length === 0 
							? 0 : (averageHelpingTime - ((new Date()) - newestStartedHelpedBucket[0].helpStartTime) / 1000 / 60); // time needed to end this one
						needTime = Math.max(0, needTime);
						info.waitingTime += needTime;
						res.status(200).end(JSON.stringify(info));
					});
				}
			});
		}
	});
};

queueHandler.insertNew = function(req, res) {
	Bucket.findOne({_id: req.body._id}, function(err, bucket) {
	    if (err) {res.status(400).end('Error checking existing SUID.');}
	    else {
	        if (!bucket) {res.status(400).end('SUID not existing.');}
	        else {
	            bucket.students.push(req.body.studentName);
	            bucket.studentSuids.push(req.body.suid);
	            bucket.save(function(err, bucket) {
	                if (err) {res.status(400).end('Error saving bucket.');}
	                else {
	                	clientList.broadcastChange();
	                	res.status(200).end(JSON.stringify(bucket));
	                }
	            });
	        }
	    }
	});
};

queueHandler.putNew = function(req, res) {
	Bucket.findOne({studentSuids: req.body.suid}, "_id", function(err, bucketExisted) {
	    if (err) {res.status(400).end('Error checking existing SUID.');}
	    else {
	        if (bucketExisted) {res.status(400).end('SUID already existed.');}
	        else {
	            var bucket = new Bucket({ 
	            	type: req.body.type,
	            	description: req.body.description, 
	            	class: req.body.class,
	            	students: [req.body.studentName],
	            	studentSuids: [req.body.suid],
	            	helperSL: undefined,
	            	position: req.body.position
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

queueHandler.attachSL = function(buckets, callback) {
	async.each(buckets, function(bucket, finishOneBucket) {
		SL.findOne({_id: bucket.helperSL}, function(err, sl) {
			if (err) { callback('Error finding sl.'); }
			else {
				bucket.helperSL = JSON.parse(JSON.stringify(sl));
				finishOneBucket();
			}
		});
	}, function(err) {
		if (err) { callback('Error attaching sl, final.'); }
		else { callback(); }
	});
};

var assembleSolved = function() {
	return new Promise(function(resolve, reject) {
		Bucket.find({solved: true}).sort({'helpEndTime': -1}).limit(20).exec(function(err, solvedBuckets) {
			if (err) { reject('Error retrieving buckets.'); }
			else {
				solvedBuckets = JSON.parse(JSON.stringify(solvedBuckets));
				DatetimeUtils.parseTime(solvedBuckets, function(err) {
					if (err) { reject(err); }
					else {
						queueHandler.attachSL(solvedBuckets, function(err) {
							if (err) { reject(err); }
							else { resolve(solvedBuckets); }
						});
					}
				});
			}
		});
	});
};

var assembleSolving = function() {
	return new Promise(function(resolve, reject) {
		Bucket.find({solved: false, helperSL: {$ne: undefined}}).sort({'helpStartTime': -1}).exec(function(err, solvingBuckets) {
			if (err) { reject('Error retrieving buckets.'); }
			else {
				solvingBuckets = JSON.parse(JSON.stringify(solvingBuckets));
				DatetimeUtils.parseTime(solvingBuckets, function(err) {
					if (err) { reject(err); }
					else {
						queueHandler.attachSL(solvingBuckets, function(err) {
							if (err) { reject(err); }
							else { resolve(solvingBuckets); }
						});
					}
				});
			}
		});
	});
};

var assemblePending = function() {
	return new Promise(function(resolve, reject) {
		Bucket.find({solved: false, helperSL: undefined}).sort({'date_time': 1}).exec(function(err, pendingBuckets) {
			if (err) { reject('Error retrieving buckets.'); }
			else {
				pendingBuckets = JSON.parse(JSON.stringify(pendingBuckets));
				DatetimeUtils.parseTime(pendingBuckets, function(err) {
					if (err) { reject(err); }
					else { resolve(pendingBuckets); }
				});
			}
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
			bucket.save().then(function() { resolve() });
		});
	});
};

var markSlAsFree = function(sl_id) {
	return new Promise(function(resolve, reject) {
		SL.findOne({currently_helping: {$ne: undefined}, _id: sl_id}).exec().then(function(sl) {
			if (sl.currently_helping === undefined) { reject('You are not helping.'); }
			else {
				sl.currently_helping = undefined; // mark sl free
				sl.save().then(function() { resolve() });
			}
		});
	});
};

queueHandler.solveBucket = function(req, res) {
	markBucketAsResolved(req.body.bucket_id)
	.then(markSlAsFree(req.session.sl_id))
	.then(messageHandler.createNewMessage(req.session.sl_id, req.body.message, req.body.bucket_id))
	.then(function() {
		res.status(200).send('Success.');
		clientList.broadcastChange();
	}).catch(function(err) {
		res.status(400).send(err);
	});
};

// so it seems like no one has touched it
var markBucketAsClean = function(bucket_id) {
	return new Promise(function(resolve, reject) {
		Bucket.findOne({_id: bucket_id}).exec().then(function(bucket) {
			if (bucket.helperSL === undefined) { reject('Error bucket not marked as being helped.'); }
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
				if (bucket.helperSL || bucket.solved) { reject('Please finish the current one first!'); }
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