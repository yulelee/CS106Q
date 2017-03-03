'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');

var queueHandler = {};

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
	var categorizedList = {};
	categorizedList.waiting = [];
	categorizedList.helping = [];
	categorizedList.solved = [];

	var tempBucketList = [];

	Bucket.find({solved: true}).sort({'date_time': 1}).limit(20).exec(function(err, solvedBuckets) {
		if (err) {res.status(400).send('Error retrieving buckets.');}
		else {
			tempBucketList = JSON.parse(JSON.stringify(solvedBuckets)); // save the solveBuckets
			Bucket.find({solved: false}).sort({'date_time': 1}).exec(function(err, unsolvedBuckets) {
				if (err) {res.status(400).send('Error retrieving buckets.');}
				else {
					tempBucketList = tempBucketList.concat(JSON.parse(JSON.stringify(unsolvedBuckets))); // have everything in one list
					async.each(tempBucketList, function(bucket, finishOneBucket) {
					    bucket.date_time = new Date(bucket.date_time).toLocaleString();
					    if (bucket.helperSL) {
					    	SL.findOne({_id: bucket.helperSL}, "", function(err, sl) { // if there is a helper, replace the _id with the actual object
					    		if (err) { res.status(400).send('Error retrieving sl.'); }
					    		else {
					    			bucket.helperSL = JSON.parse(JSON.stringify(sl));
					    			finishOneBucket();
					    		}
					    	});
					    }
					    else { finishOneBucket(); }
					}, function(err) {
					    if (err) {response.status(400).end('Error processing buckets, final');}
					    else {
					    	// now every the helper has been added, we can categorize them
					    	// into three categories, waiting, helping, and solved
					    	async.each(tempBucketList, function(bucket, finishOneBucket) {
					    		if (!bucket.helperSL) categorizedList.waiting.push(bucket);
					    		else if (!bucket.solved) categorizedList.helping.push(bucket);
					    		else categorizedList.solved.push(bucket);
					    		finishOneBucket();
					    	}, function(err) {
					    		if (err) {response.status(400).end('Error categorizing buckets, final');}
					    		else { res.end(JSON.stringify(categorizedList)); }
					    	});
					    }
					});
				}
			});
		}
	});
};

// don't use this anymore, nobody should delete a bucket directly
queueHandler.deleteBucket = function(req, res) {
	Bucket.find({_id: req.body.bucketId}, function (err, bucket) {
		if (err) {res.status(400).send('Error bucket not existing.');}
		else {
			Bucket.find({_id: req.body.bucketId}).remove(function() {
				SL.findOne({currently_helping: req.body.bucketId}, "", function(err, sl) {
					if (err) { res.status(400).send('Error retrieving the sl.'); }
					else {
						if (sl) { sl.currently_helping = undefined; }
						sl.save(function(err) {
							if (err) { res.status(400).send('Error saving the sl.'); }
							else {
								res.status(200).send('Deleted.');
								clientList.broadcastChange();
							}
						})
					}
				});
			});
		}
	});
};

queueHandler.solveBucket = function(req, res) {
	Bucket.findOne({_id: req.body.bucket_id}, "", function (err, bucket) {
		if (err) {res.status(400).send('Error bucket not existing.');}
		else {
			bucket.solved = true;
			bucket.save(function(err, savedBucket) {
				SL.findOne({currently_helping: req.body.bucket_id, _id: req.session.sl_id}, "", function(err, sl) {
					if (err) { res.status(400).send('Error retrieving the sl.'); }
					else {
						if (sl) { sl.currently_helping = undefined; }
						else { res.status(400).send('You are not helping.'); }
						sl.save(function(err, savedSL) {
							if (err) { res.status(400).send('Error saving the sl.'); }
							else {
								res.status(200).send(JSON.stringify(savedSL));
								clientList.broadcastChange();
							}
						});
					}
				});
			});
		}
	});
};

queueHandler.putBackBucket = function(req, res) {
	Bucket.findOne({_id: req.body.bucket_id}, function(err, bucket) {
		if (err) {res.status(400).send('Error bucket not existing.');}
		else {
			if (bucket.helperSL === undefined) { res.status(400).send('Error bucket not marked as being helped.'); }
			else {
				SL.findOne({_id: bucket.helperSL}, "", function(err, sl) {
					console.log(sl);
					if (err || sl.currently_helping === undefined) { res.status(400).send('Error sl not marked as being helping.'); }
					else {
						sl.currently_helping = undefined;
						sl.save(function(err, savedSL) {
							if (err) { res.status(400).send('Error saving the sl.'); }
							else {
								bucket.helperSL = undefined;
								bucket.save(function(err) {
									if (err) { res.status(400).send('Error saving the bucket.'); }
									else {
										res.status(200).send(JSON.stringify(savedSL)); 
										clientList.broadcastChange();
									}
								});
							}
						});
					}
				});
			}
		}
	});
};

queueHandler.pickBucket = function(req, res) {
    SL.findOne({_id: req.session.sl_id}, "", function(err, sl) {
        if (err) { res.status(400).send('Cannot retrieve SL.'); }
        else { 
            if (sl.currently_helping !== undefined) { res.status(400).send('Please finish the current one first!'); }
            else {
                Bucket.findOne({_id: req.body.bucket_id}, function(err, bucket) {
                    if (err) { res.status(400).send('Error retrieving bucket!'); }
                    else {
                        if (bucket.helperSL !== undefined || bucket.solved) { res.status(400).send('Somebody already helping or helped!'); }
                        else {
                        	bucket.helperSL = sl._id;
                        	bucket.save(function(err) {
                        	    if (err) { res.status(400).send('Error saving bucket!'); }
                        	    else {
                        	    	sl.currently_helping = bucket._id;
                        	    	sl.save(function(err, savedSL) {
                        	    	    if (err) { res.status(400).send('Error saving SL!'); }
                        	    	    else {
                        	    	    	res.status(200).send(JSON.stringify(savedSL)); 
                        	    	    	clientList.broadcastChange();
                        	    	    }
                        	    	});
                        	    }
                        	});
                        }
                    }
                });
            }
        }
    });
};

module.exports = queueHandler;