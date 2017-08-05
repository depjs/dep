# stream-collector

Buffer `data` from a stream into an array if a callback is provided

```
npm install stream-collector
```

[![build status](http://img.shields.io/travis/mafintosh/stream-collector.svg?style=flat)](http://travis-ci.org/mafintosh/stream-collector)

## Usage

``` js
var collect = require('stream-collector')

collect(stream, function(err, list) {
  // list contains all data chunks from stream  
})
```

The `stream` is always returned from the function. If a callback isn't provided no buffering will occur.
This allows you to do the following pattern where if you provide a callback the stream will be buffered (similar to how [request](https://github.com/mikeal/request) works)

``` js
var read = function(cb) {
  var stream = db.createReadStream()
  return collect(stream, cb)
}

var stream = read() // does not buffer

read(function(err, list) {
  // buffers the data
})
```

## License

MIT
