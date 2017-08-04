# dat-secret-storage

Store secret keys for hyperdrive archives in the user's home directory.

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

## Install

```
npm install dat-secret-storage
```

## Usage

Return for the `secret_key` storage in hyperdrive/hypercore.

```js
var secretStore = require('dat-secret-storage')

var storage = {
  metadata: function (name, opts) {
    if (name === 'secret_key') return secretStore()(name, opts)
    return // other storage
  },
  content: function (name, opts) {
    return // other storage
  }
}

// store secret key in ~/.dat/secret_keys
var archive = hyperdrive(storage)
```

## API

### `secretStorage([dir])`

* `dir`: directory to store keys under `dir/.dat/secret_keys`. Defaults to users home directory.

## License

[MIT](LICENSE.md)

[npm-image]: https://img.shields.io/npm/v/dat-secret-storage.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/dat-secret-storage
[travis-image]: https://img.shields.io/travis/joehand/dat-secret-storage.svg?style=flat-square
[travis-url]: https://travis-ci.org/joehand/dat-secret-storage
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
