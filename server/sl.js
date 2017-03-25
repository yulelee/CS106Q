'use strict';

var async = require('async');

var SL = require('../schema/sl.js');
var clientList = require('./clientList.js');
var Bucket = require('../schema/bucket.js');

var GeneralUtil = require('./util.js');

var slHandler = {};

slHandler.attachBucket = function(sl) {
    return Bucket.findOne({_id: sl.currently_helping}).exec().then(GeneralUtil.parseCopy)
    .then(GeneralUtil.parseCopy).then(function(bucket) {
        sl.currently_helping = bucket;
        return sl;
    }).catch(function(err) {
        throw err;
    });
};

slHandler.attachBuckets = function(sls) {
    return new Promise(function(resolve, reject) {
        async.each(sls, function(sl, finishOneSL) {
            if (sl.currently_helping) { slHandler.attachBucket(sl).then(function() { finishOneSL(); }); }
            else { finishOneSL(); }
        }, function(err) {
            if (err) { reject(err); }
            else { resolve(sls); }
        });
    });
};

slHandler.getCurSLlist = function(req, res) {
    SL.find({logged_in_sessionId: {$ne : undefined}}).exec()
    .then(GeneralUtil.parseCopy)
    .then(slHandler.attachBuckets)
    .then(function(sls) {
        res.status(200).send(JSON.stringify(sls));
    }).catch(function(err) {
        res.status(400).send(err);
    });
};

slHandler.getSL = function(req, res) {
    SL.findOne({_id: req.session.sl_id}).exec()
    .then(GeneralUtil.parseCopy)
    .then(slHandler.attachBucket)
    .then(function(sl) {
        res.status(200).send(JSON.stringify(sl));
    }).catch(function(err) {
        res.status(400).send(err);
    });
};

module.exports = slHandler;