# fd-read-stream

Readable stream that reads from a file descriptor. Supports tailing and retries.

```
npm install fd-read-stream
```

## Usage

``` js
var fs = require('fs')
var createReadStream = require('fd-read-stream')

var rs = createReadStream(fs.openSync('some-file', 'r'))

rs.pipe(process.stdout)
```

## API

#### `var rs = createReadStream(fd, [options])`

Create a new readable stream. Options include:

``` js
{
  tail: false // keep reading the fd forever (will pool it)
  retry: 0 // wait this many ms and retry a read once if it fails
}
```

## License

MIT
