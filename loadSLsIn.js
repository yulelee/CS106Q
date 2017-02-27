"use strict";

var mongoose = require('mongoose');
var async = require('async');


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
            mongoose.disconnect();
        });
    });
});