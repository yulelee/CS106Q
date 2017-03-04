"use strict";

var mongoose = require('mongoose');
var async = require('async');
var data = require('./initData.js')

mongoose.connect('mongodb://localhost/CS106Q');

var SL = require('./schema/sl.js');
var Bucket = require('./schema/bucket.js');

var fs = require('fs');

SL.remove({}, function() {
    var lines = fs.readFileSync('./SideEffects/CrawlForSLs/firstLevel.txt').toString().split('\n');

    async.each(lines, function(line, finishOneLine) {
        var suid = line.substr(0, line.indexOf(' '));
        var name = line.substr(line.indexOf(' ') + 1);
        SL.create({
            suid: suid,
            name: name
        }, function (err) {
            if (err) { console.error('Error creating SL', err); } 
            else { finishOneLine(); }
        });
    }, function() {
        Bucket.remove({}, function() {
            async.each(data.buckets, function(bucket, finishOneBucket) {
                var newBucket = new Bucket({ 
                    type: bucket.type,
                    description: bucket.description, 
                    class: bucket.class,
                    students: bucket.students,
                    studentSuids: bucket.studentSuids
                });
                newBucket.save(function(err) {
                    finishOneBucket();
                });
            }, function(err) {
                mongoose.disconnect();
            });
        });
    });
});