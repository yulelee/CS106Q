'use strict';

var async = require('async');

// var MongoStore = require('connect-mongo')(require('express-session'));
// var mongoStore = new MongoStore({mongooseConnection: require('mongoose').connection});

var clientList = {};

// the list is a dictionary, the key is the session ID, and the value
// is an list of connections, i.e. could be tabs from the same browser
clientList.list = {};

clientList.broadcastChange = function() {
	async.each(clientList.list, function(resList) {
        async.each(resList, function(res) {
            var d = new Date();
            res.write('id: ' + d.getMilliseconds() + '\n');
            res.write('data:' + 'refresh' +   '\n\n'); // Note the extra newline
        });
	});
};

clientList.forceLogout = function(sl) {
    var list = clientList.list[sl.logged_in_sessionId];
    if (list) {
        async.each(list, function(res) {
            var d = new Date();
            res.write('id: ' + d.getMilliseconds() + '\n');
            res.write('data:' + 'forceLogout' +   '\n\n'); // Note the extra newline
        });
    }
    return sl;
};

clientList.registerClient = function(req, res) { 
    req.socket.setTimeout(60 * 60 * 6 * 1000);

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('\n');
 
    if (!clientList.list[req.sessionID]) { clientList.list[req.sessionID] = []; }
    clientList.list[req.sessionID].push(res);
    console.log('added client: ' + req.sessionID + ', now length = ' + clientList.list[req.sessionID].length);
 
    req.on("close", function() {
        var ress = clientList.list[req.sessionID];
        for (var i = 0; i < ress.length; i++) {
            if (ress[i] === res) {
                ress.splice(i, 1);
                break;
            }
        }
        console.log('removed client: ' + req.sessionID + ', now length = ' + ress.length);
        if (ress.length === 0) { delete clientList.list[req.sessionID]; }
    });
};

module.exports = clientList;