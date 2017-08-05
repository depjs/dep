# dat-link-resolve

resolve urls, links to a dat key using common methods

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

### Supports

* Common dat key representations (`dat://`, etc.)
* URLs with keys in them (`datproject.org/6161616161616161616161616161616161616161616161616161616161616161`)
* `hyperdrive-key` or `dat-key` headers
* Url to JSON http request that returns `{key: <dat-key>}`

## Install

```
npm install dat-link-resolve
```

## Usage

```js
var datResolve = require('dat-link-resolve')

datResolve(link, function (err, key) {
  console.log('found key', key)
})
```

## API

### `datResolve(link, callback(err, key))`

Link can be string or buffer.

Resolution order:

1. Validate buffers or any strings with 64 character hashes in them via [dat-encoding](https://github.com/juliangruber/dat-encoding)
2. Check headers in http request
3. Check JSON request response for `key`

## Contributing

Contributions welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## License

[MIT](LICENSE.md)

[npm-image]: https://img.shields.io/npm/v/dat-link-resolve.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/dat-link-resolve
[travis-image]: https://img.shields.io/travis/joehand/dat-link-resolve.svg?style=flat-square
[travis-url]: https://travis-ci.org/joehand/dat-link-resolve
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
