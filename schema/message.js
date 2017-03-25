"use strict";

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var messageSchema = new mongoose.Schema({
    slPoster: mongoose.Schema.Types.ObjectId,
    content: String,
    associatedBucket: mongoose.Schema.Types.ObjectId,
    date_time: { type: Date, default: Date.now }
});

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;