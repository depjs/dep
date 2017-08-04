var varint = require('varint');

var POOL_SIZE = 100000;
var MINIMUM_POOL_LENGTH = 100;
var pool = new Buffer(POOL_SIZE);

exports.read = function(stream, cb) {
  var msglen = 0;
  var prev = null;
  var lock = false;

  var unlock = function() {
    lock = false
  };

  var readable = function() {
    if (lock) return;
    lock = true;

    if (!msglen) {
      var buf = stream.read();
      if (!buf) return unlock();
      if (prev) {
        buf = Buffer.concat([prev, buf]);
        prev = null;
      }

      for (var i = 0; i < buf.length; i++) {
        if (!(buf[i] & 0x80)) {
          msglen = varint.decode(buf);
          break;
        }
      }
      if (!msglen) {
        prev = buf;
        return unlock();
      }
      buf = buf.slice(varint.decode.bytes);
      stream.unshift(buf);
    }

    var chunk = stream.read(msglen);
    if (!chunk) return unlock();

    stream.removeListener('readable', readable);
    cb(chunk)
  };

  stream.on('readable', readable);
  readable();
};

exports.write = function(stream, msg) {
  if (typeof msg === 'string') msg = new Buffer(msg);
  varint.encode(msg.length, pool);
  var lenBuf = pool.slice(0, varint.encode.bytes);
  pool = pool.slice(varint.encode.bytes);
  if (pool.length < MINIMUM_POOL_LENGTH) pool = new Buffer(POOL_SIZE);

  stream.write(lenBuf);
  stream.write(msg);
};
