"use strict";

var mongoose = require('mongoose');

var slSchema = new mongoose.Schema({
    suid: String,
    name: String,
    currently_helping: {type: mongoose.Schema.Types.ObjectId, default:  undefined},
    logged_in_sessionId: {type: String, default: undefined}
});

var SL = mongoose.model('SL', slSchema);

// make this available to our photos in our Node applications
module.exports = SL;