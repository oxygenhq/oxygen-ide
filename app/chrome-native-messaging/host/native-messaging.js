
module.exports = function (handleMessage){

    process.stdin.on('readable', function () {
      var input = []
      var chunk
      while (chunk = process.stdin.read()) {
        input.push(chunk)
      }
      input = Buffer.concat(input)
  
      var msgLen = input.readUInt32LE(0)
      var dataLen = msgLen + 4
  
      if (input.length >= dataLen) {
        var content = input.slice(4, dataLen)
        var json = JSON.parse(content.toString())
        handleMessage(json)
      }
    })
  
    function sendMessage (msg) {
      if(Buffer && Buffer.from){
        var buffer = Buffer.from(JSON.stringify(msg))
    
        var header = Buffer.alloc(4)
        header.writeUInt32LE(buffer.length, 0)
    
        var data = Buffer.concat([header, buffer])
        process.stdout.write(data)
      }
    }
  
    process.on('uncaughtException', function(err){
      sendMessage({error: err.toString()})
    })
  
    return sendMessage
  
  }