'use strict';

var async = require('async');

var datetimeUtils = {};

datetimeUtils.parseSingleDate = function(object, callback) {
	object.date_time = new Date(object.date_time).toLocaleString('en-US', {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour12: true, 
		hour: "2-digit", 
		minute: "2-digit"
	});
	callback();
};

datetimeUtils.parseSingleTime = function(object, callback) {
	object.date_time = new Date(object.date_time).toLocaleString('en-US', {
		hour12: true, 
		hour: "2-digit", 
		minute: "2-digit"
	});
	callback();
};

datetimeUtils.parseDate = function(objects, callback) {
	async.each(objects, function(object, finishOneObject) {
		datetimeUtils.parseSingleDate(object, finishOneObject);
	}, function(err) {
		if (err) { callback('Error attaching date strings, final.'); }
		else { callback(); }
	});
};

datetimeUtils.parseTime = function(objects, callback) {
	async.each(objects, function(object, finishOneObject) {
		datetimeUtils.parseSingleTime(object, finishOneObject);
	}, function(err) {
		if (err) { callback('Error attaching time strings, final.'); }
		else { callback(); }
	});
};

module.exports = datetimeUtils;