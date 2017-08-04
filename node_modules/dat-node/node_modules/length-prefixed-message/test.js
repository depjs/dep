var fs = require('fs');
var test = require('tape');
var concat = require('concat-stream');
var lpm = require('./');
var choppa = require('choppa');
var varint = require('varint');

test('.read', function(t) {
  lpm.read(fs.createReadStream('./fixtures'), function(buf) {
    t.equal(buf.toString(), 'When Gregor Samsa woke up one morning from unsettling dreams, he found himself changed \n');
    t.end();
  });
});

test('.read with chunked stream', function(t) {
  var chp = choppa();
  fs.createReadStream('./fixtures2').pipe(chp);
  lpm.read(chp, function(buf) {
    t.equal(buf.toString().substr(0, 33), 'As Gregor Samsa awoke one morning');
    t.end();
  });
});

test('.write', function(t) {
  var stream = concat(function(buff) {
    var len = varint.decode(buff);
    t.equal(len, 11);

    var str = buff.slice(varint.decode.bytes).toString();
    t.equal(str, 'Hello world');
    t.end();
  });
  lpm.write(stream, new Buffer('Hello world'));
  stream.end();
});

test('.write string support', function(t) {
  var stream = concat(function(buff) {
    var len = varint.decode(buff);
    t.equal(len, 11);

    var str = buff.slice(varint.decode.bytes).toString();
    t.equal(str, 'Hello world');
    t.end();
  });
  lpm.write(stream, new Buffer('Hello world'));
  stream.end();
});
