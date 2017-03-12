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
var messageHandler = require('./server/message.js');

app.post('/putnew', queueHandler.putNew);
app.post('/insertNew', queueHandler.insertNew);
app.get('/getCurrentList', queueHandler.getCurrentList);
app.get('/getCurInfo', queueHandler.getCurInfo);

app.post('/deleteBucket', slLoginHandler.slLoginCheck, queueHandler.deleteBucket);
app.post('/pickBucket', slLoginHandler.slLoginCheck, queueHandler.pickBucket);
app.post('/putBackBucket', slLoginHandler.slLoginCheck, queueHandler.putBackBucket);
app.post('/solveBucket', slLoginHandler.slLoginCheck, queueHandler.solveBucket);

app.post('/slLogin', slLoginHandler.slLogin);
app.post('/slLogout', slLoginHandler.slLoginCheck, slLoginHandler.slLogout);

app.get('/getCurSLlist', slLoginHandler.slLoginCheck, slHandler.getCurSLlist);
app.get('/getSL', slLoginHandler.slLoginCheck, slHandler.getSL);

app.get('/getMessageList', slLoginHandler.slLoginCheck, messageHandler.getMessageList);
app.post('/dismissMessage', slLoginHandler.slLoginCheck, messageHandler.dismissMessage);
app.post('/dismissAllMessages', slLoginHandler.slLoginCheck, messageHandler.dismissAllMessages);
app.post('/addMessageOutOfNowhere', slLoginHandler.slLoginCheck, messageHandler.addMessageOutOfNowhere);

var clientList = require('./server/clientList.js');
app.get('/registerClient', clientList.registerClient);

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});

// mainly for update the remaining time
setInterval(function() {
	clientList.broadcastChange();
}, 1000 * 60);