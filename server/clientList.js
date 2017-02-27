'use strict';

var async = require('async');

var clientList = {};

clientList.list = [];

clientList.broadcastChange = function () {
	async.each(clientList.list, function(res, finishOneRes) {
	    var d = new Date();
	    res.write('id: ' + d.getMilliseconds() + '\n');
	    res.write('data:' + 'refresh' +   '\n\n'); // Note the extra newline
	    finishOneRes();
	}, function(err) {
	    if (err) {console.log('Error broadcasting change, final');}
	});
};

clientList.registerClient = function(req, res) {
 
    req.socket.setTimeout(60 * 60 * 6 * 1000);

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('\n');
 
    // push this res object to our global variable
    clientList.list.push(res);
 
    // When the request is closed, e.g. the browser window
    // is closed. We search through the open connections
    // array and remove this connection.
    req.on("close", function() {
        var toRemove;
        console.log("die one");
        for (var j =0 ; j < clientList.list.length ; j++) {
            if (clientList[j] == res) {
                toRemove =j;
                break;
            }
        }
        clientList.list.splice(j,1);
    });
};

module.exports = clientList;