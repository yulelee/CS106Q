"use strict";

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/CS106Q');

var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(express.static(__dirname));
app.use(bodyParser.json());

var queueHandler = require('./server/queue.js');
app.post('/putnew', queueHandler.putNew);
app.post('/insertNew', queueHandler.insertNew);
app.get('/getCurrentList', queueHandler.getCurrentList);
app.post('/deleteBucket', queueHandler.deleteBucket);

var clientList = require('./server/clientList.js');
app.get('/registerClient', clientList.registerClient);

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});