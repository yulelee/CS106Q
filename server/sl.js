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
                else { res.status(200).send(JSON.stringify(curSLs)); }
            });
        }
    });
};

slHandler.getSL = function(req, res) {
    SL.findOne({_id: req.session.sl_id}, "", function(err, sl) {
        if (err) { res.status(400).send('Error searching for SL.'); }
        else { 
            if (sl.currently_helping) {
                Bucket.findOne({_id: sl.currently_helping}, function(err, bucket) {
                    if (err) { res.status(400).send('Error retrieving bucket!'); }
                    else {
                        // the returned sl contains the whole bucket object
                        sl = JSON.parse(JSON.stringify(sl));
                        sl.currently_helping = JSON.parse(JSON.stringify(bucket));
                        res.status(200).send(JSON.stringify(sl));
                    }
                });
            }
            else { res.status(200).send(JSON.stringify(sl)); }
        }
    });
};

module.exports = slHandler;