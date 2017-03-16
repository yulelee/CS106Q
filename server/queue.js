'use strict';

var async = require('async');

var Bucket = require('../schema/bucket.js');
var clientList = require('./clientList.js');
var SL = require('../schema/sl.js');
var Message = require('../schema/message.js');

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
					    bucket.date_time = new Date(bucket.date_time).toLocaleTimeString('en-US', {hour12: true, hour: "2-digit", minute: "2-digit"});
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
			// mark resolved
			bucket.solved = true;
			bucket.helpEndTime = new Date(); // record the end time
			bucket.save(function(err, savedBucket) {
				SL.findOne({currently_helping: req.body.bucket_id, _id: req.session.sl_id}, "", function(err, sl) {
					if (err) { res.status(400).send('Error retrieving the sl.'); }
					else {
						if (!sl) { res.status(400).send('You are not helping.'); }
						else {
							// mark sl free
							sl.currently_helping = undefined;
							sl.save(function(err, savedSL) {
								if (err) { res.status(400).send('Error saving the sl.'); }
								else {
									if (req.body.message) {
										var message = new Message({ 
											slPoster: req.session.sl_id,
											content: req.body.message, 
											associatedBucket: req.body.bucket_id
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
										    					SL.findOne({_id: req.session.sl_id}, function(err, sl) {
										    						if (err) { res.status(400).end('Error finding the sl again at the end.'); }
										    						else {
										    							res.status(200).send(JSON.stringify(sl));
										    							clientList.broadcastChange();
										    						}
										    					});
										    				}
										    			});
										    		}
										    	});
										    }
										});
									}
									else {
										res.status(200).send(JSON.stringify(savedSL));
										clientList.broadcastChange();
									}
								}
							});
						}
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
					if (err || sl.currently_helping === undefined) { res.status(400).send('Error sl not marked as being helping.'); }
					else {
						sl.currently_helping = undefined;
						sl.save(function(err, savedSL) {
							if (err) { res.status(400).send('Error saving the sl.'); }
							else {
								bucket.helperSL = undefined;
								bucket.helpStartTime = undefined; // erase the starting time of this help
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
                Bucket.findOne({_id: req.body.bucket_id}, "", function(err, bucket) {
                    if (err) { res.status(400).send('Error retrieving bucket!'); }
                    else {
                        if (bucket.helperSL !== undefined || bucket.solved) { res.status(400).send('Somebody already helping or helped!'); }
                        else {
                        	bucket.helperSL = sl._id;
                        	bucket.helpStartTime = new Date(); // record the current time
                        	bucket.save(function(err) {
                        	    if (err) { res.status(400).send('Error saving bucket!'); }
                        	    else {
                        	    	sl.currently_helping = bucket._id;
                        	    	sl.save(function(err, savedSL) {
                        	    	    if (err) { res.status(400).send('Error saving SL!'); }
                        	    	    else {
                        	    	    	// the returned sl contains the whole bucket object
                        	    	    	savedSL = JSON.parse(JSON.stringify(savedSL));
                        	    	    	savedSL.currently_helping = JSON.parse(JSON.stringify(bucket));
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