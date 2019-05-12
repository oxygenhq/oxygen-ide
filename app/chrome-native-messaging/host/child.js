var http = require('http');
var pathJoin = require('path').join;
var fs = require('fs');
var logPath = pathJoin(__dirname, 'childout.log');
var WebSocketServer = require('websocket').server;
var server;
var connection;

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

var logText = 'child run';
fs.writeFileSync(logPath, logText);

  
var log = function log(str) {
    fs.writeFileSync(logPath, "\r\n".concat(str, "\r\n"), {
        flag: 'a'
    });
};

try {
    server = http.createServer(function(request, response) {
      console.log((new Date()) + ' Received request for ' + request.url);
      response.writeHead(404);
      response.end();
    })
    server.listen(5002, function() {
        log((new Date()) + ' Server is listening on port 5002');
    });
    
    wsServer = new WebSocketServer({
      httpServer: server,
      // You should not use autoAcceptConnections for production
      // applications, as it defeats all standard cross-origin protection
      // facilities built into the protocol and the browser.  You should
      // *always* verify the connection's origin and decide whether or not
      // to accept it.
      autoAcceptConnections: false
    });
} catch(e){
    log('e'+e);
}

process.on('message', function(msg){
    log('Message from parent:'+JSON.stringify(msg));
});
  
var counter = 0;

setInterval(function(){
    process.send({ fromChild: true, counter: counter++ });
}, 3000);


wsServer.on('request', function(request) {
    try {
        log('request');
        if (!originIsAllowed(request.origin)) {
            log('if');
            // Make sure we only accept requests from an allowed origin
            request.reject();
            log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
            return;
        }
        log('not if');

        connection = request.accept('echo-protocol', request.origin);
        log((new Date()) + ' Connection accepted.');
        
        process.send({ fromSocketServer: true, connection: 'accepted' });

        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                try{
                    // var data = JSON.parse(message.utf8Data);
    
                    // for(var i in data) {
                    //     log('Received Message i ' + i);
                    // }
                    var msg = JSON.parse(message.utf8Data);
    
                    // log('Received Message data: ' + msg);
                    log('Received Message data json: ' + JSON.stringify(msg));
                    // log('Received Message: ' + message.utf8Data);
                    process.send(msg);
                    // connection.sendUTF(message.utf8Data);
                } catch(e){
                    console.log('96 e '+e);
                }
            }
            else if (message.type === 'binary') {
                log('Received Binary Message of ' + message.binaryData.length + ' bytes');
                connection.sendBytes(message.binaryData);
            }
        });
        connection.on('close', function(reasonCode, description) {
            process.send({ fromSocketServer: true, connection: 'disconnected' });
            log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        });

    } catch(e){
        log('e'+e);
    }
});