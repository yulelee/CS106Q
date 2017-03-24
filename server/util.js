'use strict';

var async = require('async');

var GeneralUtil = {};

// sometime the objects returned from database is not easily over-writable,
// by making a copy of that object, we can easily rewrite and modify the fields
GeneralUtil.parseCopy = function(object) {
	return new Promise(function(resolve, reject) {
		resolve(JSON.parse(JSON.stringify(object)));
	});
};

module.exports = GeneralUtil;