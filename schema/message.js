"use strict";

var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
    slPoster: mongoose.Schema.Types.ObjectId,
    content: String,
    associatedBucket: mongoose.Schema.Types.ObjectId,
    date_time: {
    	type: Date, 
    	default: Date.now
    }
});

var Message = mongoose.model('Message', messageSchema);

// make this available to our photos in our Node applications
module.exports = Message;