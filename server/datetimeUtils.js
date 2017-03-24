'use strict';

var async = require('async');

var datetimeUtils = {};

// This module assume the object/objects being passed in
// has a data_time field

datetimeUtils.parseSingleDate = function(object) {
	return new Promise(function(resolve, reject) {
		object.date_time = new Date(object.date_time).toLocaleString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour12: true, 
			hour: "2-digit", 
			minute: "2-digit"
		});
		resolve();
	});
};

datetimeUtils.parseSingleTime = function(object) {
	return new Promise(function(resolve, reject) {
		object.date_time = new Date(object.date_time).toLocaleString('en-US', {
			hour12: true, 
			hour: "2-digit", 
			minute: "2-digit"
		});
		resolve();
	});
};

datetimeUtils.parseDate = function(objects) {
	return new Promise(function(resolve, reject) {
		async.each(objects, function(object, finishOneObject) {
			datetimeUtils.parseSingleDate(object).then(finishOneObject);
		}, function(err) {
			if (err) { reject(err); }
			else { resolve(objects); }
		});
	});
};

datetimeUtils.parseTime = function(objects) {
	return new Promise(function(resolve, reject) {
		async.each(objects, function(object, finishOneObject) {
			datetimeUtils.parseSingleTime(object).then(finishOneObject);
		}, function(err) {
			if (err) { reject(err); }
			else { resolve(objects); }
		});
	});
};

datetimeUtils.sortNewestFirst = function(objects) {
	return new Promise(function(resolve, reject) {
		objects.sort(function(a, b) { return new Date(b.date_time) - new Date(a.date_time); });
		resolve(objects);
	});
};

module.exports = datetimeUtils;