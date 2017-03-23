"use strict";

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var bucketSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Debugging', 'Conceptual']
    },
    position: String,
    description: String, 
    date_time: {
    	type: Date, 
    	default: Date.now
    }, 
    class: {
        type: String,
        enum: ['CS106A', 'CS106B', 'CS106X']
    },
    students: [String],
    studentSuids: [String],
    solved: {type: Boolean, default:  false},
    helperSL: {type: mongoose.Schema.Types.ObjectId, default:  undefined},
    helpStartTime: {
        type: Date, 
        default: undefined
    }, 
    helpEndTime: {
        type: Date, 
        default: undefined
    }
});

var Bucket = mongoose.model('Bucket', bucketSchema);

// make this available to our photos in our Node applications
module.exports = Bucket;