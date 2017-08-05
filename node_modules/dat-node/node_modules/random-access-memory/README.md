# random-access-memory

Exposes the same interface as [random-access-file](https://github.com/mafintosh/random-access-file) but instead of writing/reading data to a file it maintains it in memory. This is useful when running tests where you don't want to write files to disk.

```
npm install random-access-memory
```

[![build status](http://img.shields.io/travis/mafintosh/random-access-memory.svg?style=flat)](http://travis-ci.org/mafintosh/random-access-memory)

## Usage

``` js
var ram = require('random-access-memory')
var file = ram()

file.write(0, Buffer('hello'), function () {
  file.write(5, Buffer(' world'), function () {
    file.read(0, 11, console.log) // returns Buffer(hello world)
  })
})
```

You can also initialize a `ram` instance with a `Buffer`:

```js
var file = ram(Buffer('hello world'))
```

## License

MIT
