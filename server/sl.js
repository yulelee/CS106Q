'use strict';

var async = require('async');

var SL = require('../schema/sl.js');
var clientList = require('./clientList.js');
var Bucket = require('../schema/bucket.js');

var slHandler = {};

slHandler.getCurSLlist = function(req, res) {
    SL.find({logged_in_sessionId: {$ne : undefined}}, function(err, curSLs) {
        if (err) { res.status(400).send('Error.'); }
        else { 
            curSLs = JSON.parse(JSON.stringify(curSLs)); 
            async.each(curSLs, function(sl, finishOneSL) {
                if (sl.currently_helping) {
                    Bucket.findOne({_id: sl.currently_helping}, function(err, bucket) {
                        if (err) { res.status(400).send('Error retrieving bucket!'); }
                        else { 
                            sl.currently_helping = JSON.parse(JSON.stringify(bucket)); 
                            finishOneSL();
                        }
                    });
                } 
                else { finishOneSL(); }
            }, function(err) {
                if (err) {res.status(400).send('Error retrieving bucket!');}
                else { console.log(curSLs); res.status(200).send(JSON.stringify(curSLs)); }
            });
        }
    });
};

slHandler.pickBucket = function(req, res) {
    console.log(req.body.bucket_id);
    SL.findOne({_id: req.session.sl_id}, "", function(err, sl) {
        if (err) { res.status(400).send('Cannot retrieve SL.'); }
        else { 
            console.log(sl);
            console.log(sl.currently_helping);
            if (sl.currently_helping !== undefined) { res.status(400).send('Please finish the current one first!'); }
            else {
                console.log(sl.currently_helping);
                Bucket.findOne({_id: req.body.bucket_id}, function(err, bucket) {
                    console.log(bucket);
                    if (err) { res.status(400).send('Error retrieving bucket!'); }
                    else {
                        if (bucket.helperSL !== undefined) { res.status(400).send('Somebody already helping!'); }
                        bucket.helperSL = req.session.sl_id;
                        bucket.save(function(err) {
                            if (err) { res.status(400).send('Error saving bucket!'); }
                            sl.currently_helping = bucket._id;
                            sl.save(function(err, savedSL) {
                                if (err) { res.status(400).send('Error saving SL!'); }
                                res.status(200).send(JSON.stringify(savedSL)); 
                                clientList.broadcastChange();
                            });
                        });
                    }
                });
            }
        }
    });
};

module.exports = slHandler;