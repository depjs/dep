# dat-storage

Dat specific storage provider for [Hyperdrive](https://github.com/mafintosh/dat-storage)

```
npm install dat-storage
```

## Usage

``` js
var storage = require('dat-storage')

// files are stored in ./my-dataset
// metadata (hashes and stuff) are stored in ./my-dataset/.dat
var archive = hyperdrive(storage('my-dataset'))
```

## License

MIT
