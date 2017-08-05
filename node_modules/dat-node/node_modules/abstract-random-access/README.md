
# abstract-random-access

Base class for random access stores, such as

- [random-access-file](https://github.com/mafintosh/random-access-file)
- [random-access-memory](https://github.com/mafintosh/random-access-memory)

## Features

- ensures the store has been `.open()`ed
- verifies and defaults arguments
- provides stubs for unimplemented functions
- emits `open` and `close` events

## Example

```js
var Abstract = require('abstract-random-access')
var inherits = require('inherits')

var Store = function () {
  Abstract.call(this)  
}

inherits(Store, Abstract)

Store.prototype._read = function (offset, length, callback) {
  process.nextTick(function () {
    callback(null, Buffer('ohai'))  
  })  
}
```

## License

MIT
