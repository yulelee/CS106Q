"use strict";

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/CS106Q');

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');

var app = express();

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false,
}));

var slLoginHandler = require('./server/slLogin.js');
var slHandler = require('./server/sl.js');
var queueHandler = require('./server/queue.js');

app.post('/putnew', queueHandler.putNew);
app.post('/insertNew', queueHandler.insertNew);
app.get('/getCurrentList', queueHandler.getCurrentList);

app.post('/deleteBucket', slLoginHandler.slLoginCheck, queueHandler.deleteBucket);
app.post('/pickBucket', slLoginHandler.slLoginCheck, slHandler.pickBucket);

app.post('/slLogin', slLoginHandler.slLogin);
app.post('/slLogout', slLoginHandler.slLoginCheck, slLoginHandler.slLogout);

app.get('/getCurSLlist', slLoginHandler.slLoginCheck, slHandler.getCurSLlist);

var clientList = require('./server/clientList.js');
app.get('/registerClient', clientList.registerClient);

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});