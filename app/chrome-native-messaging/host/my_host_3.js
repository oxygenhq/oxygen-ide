#!/usr/bin/env node
var execFile = require('child_process').execFile;
var safeBuffer = require('safe-buffer').Buffer;
var fs = require('fs');
var util = require('util');
var fork = require('child_process').fork;
var pathJoin = require('path').join;
var logPath = pathJoin(__dirname, 'out.log');
var connection;
var forked;

var log = function log(str) {
  fs.writeFileSync(logPath, "\r\n".concat(str, "\r\n"), {
    flag: 'a'
  });
};

try {
    forked = fork('child.js');

    forked.on('message', function(msg){
      try {
        var signedMsg
        
        if(typeof msg === 'string'){
          log('typeof string '+msg);
          signedMsg = JSON.parse(signedMsg);
        } else if(typeof msg === 'object'){
          signedMsg = msg;
        }

        if(signedMsg){
          signedMsg.fromChild = true;
          log('Message from child process'+JSON.stringify(signedMsg));
          send(signedMsg);
        } else {
          log('Uncovered message type');
        }
      } catch(e){
        log('28 '+e);
      }
    });
    
    log('forked send');
    forked.send({ hello: 'world' });
} catch(e){
  log('35'+e);
}

var logText = '' + new Date().toLocaleString() + '' + process.argv.map(function (v, i) {
  return "".concat(i, ": ").concat(v);
}).join('\n') + '=========================';
fs.writeFileSync(logPath, logText);

var lengthBytes = 4;

process.on('exit', function(code){
  if(forked && forked.kill){
    forked.kill();
    log('forked.kill');
  } else {
    log('no forked.kill');
  }

  send({
    beforeExit: true,
    fromHost: true
  });

  log('About to exit with code: '+code);
});

process.stdin.on('data', function (_data) {
  try{
    // log('once 1');
    var data = new Buffer(_data);
    // log('once 2');
    var lengthBuffer = data.slice(0, lengthBytes);
    // log('once 3');
    var bodyBuffer = data.slice(lengthBytes);

    // log('once 5');
    // log("data.length: ".concat(data.length));
    // log("data: ".concat(data));
    // log('once data');

    var input = JSON.parse(bodyBuffer.toString());
    // log("[input]\n".concat(JSON.stringify(input, null, '\t')));

    // log('once 6');
    var preInput = "".concat(JSON.stringify(input, null, '\t'))
    // log('once 7 '+ preInput );
    var inputJson = JSON.parse(preInput);

    // log('inputJson'+JSON.stringify(inputJson));

    inputJson.fromHost = true;

    // log('once 8');
    send(inputJson);

    setTimeout(
      function func() {
        inputJson.fromTimeout = true;
        send(inputJson);
      }
    , 1000);

    setInterval(
      function func() {
        inputJson.fromTimeout = true;
        send({
          live: true,
          fromHost: true
        });
      }
      ,2000
    )
    

  } catch(e) {
    log('91 '+e);
  }

});

var send = function send(messageObject) {
  try{
    // log('stdout 1');
    var message;
  
    if(typeof messageObject === 'string'){
      message = messageObject;
    } else if(typeof messageObject === 'object'){
      message = JSON.stringify(messageObject);
    }

    // io.emit(message)
    // log('stdout 2');
    var messageBuffer = safeBuffer.from(message);
    // log('stdout 3');
    var length = messageBuffer.length;
    // log('stdout 4');

    var len = new Buffer(4);
    // log('stdout 5');
    var buf = new Buffer(message);

    // log('stdout 6');
    len.writeUInt32LE(messageBuffer.length, 0);
    // log('stdout 7');
    process.stdout.write(len);
    // log('stdout 8 '+message);
    process.stdout.write(messageBuffer);

  } catch(e) {
    log('messageObject: '+message);
    log('134: '+e);
    process.exit()
  }
};

send({hostInit: true});