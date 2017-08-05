# dat-ignore

> default ignore for dat

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

Check if a file should be ignored for Dat:

* Ignore `.dat` by default
* Use the `.datignore` file
* Optionally ignore all hidden files
* Add in other custom ignore matches

## Install

```
npm install dat-ignore
```

## Usage

```js
var datIgnore = require('dat-ignore')
var ignore = datIgnore('/data/dir')

console.log(ignore('.dat')) // true
console.log(ignore('.git')) // true
console.log(ignore('dat-data')) // false
console.log(ignore('cat.jpg')) // false
```

Uses [anymatch](https://github.com/es128/anymatch) to match file paths.

### Example Options

Common configuration options.

#### Add custom ignore

```js
var ignore = datIgnore('/data/dir', {
    ignore: [
      '**/node_modules/**', 
      'path/to/file.js',
      'path/anyjs/**/*.js'
    ]
  })
```

#### Allow Hidden Files

```js
var ignore = datIgnore('/data/dir', { ignoreHidden: false })
```

####  Change Dat Ignore Path

```js
var ignore = datIgnore('/data/dir', {
    datignorePath: '~/.datignore'
  })
```

#### `.datignore` as string/buffer

Pass in a string as a newline delimited list of things to ignore.

```js
var datIgnoreFile = fs.readFileSync('~/.datignore')
datIgnoreFile += '\n' + fs.readFileSync(path.join(dir, '.datignore'))
datIgnoreFile += '\n' + fs.readFileSync(path.join(dir, '.gitignore'))

var ignore = datIgnore('/data/dir', { datignore: datIgnoreFile })
```

## API

### `var ignore = datIgnore([dir], [opts])`

Returns a function that checks if a path should be ignored:

```js
ignore('.dat') // true
ignore('.git') // true
ignore('data/cats.csv') // false
```

#### `dir`

`dir` is used to find `.datignore` and is prepended to paths found in `.datignore`.

#### Options:

* `opts.ignore` - Extend custom ignore with any anymatch string or array.
* `opts.useDatIgnore` - Use the `.datignore` file in `dir` (default: true)
* `opts.ignoreHidden` - Ignore all hidden files/folders (default: true)
* `opts.datignorePath` - Path to `.datignore` file (default: `dir/.datignore`)
* `opts.datignore` - Pass `.datignore` as buffer or string

## License

[MIT](LICENSE.md)

[npm-image]: https://img.shields.io/npm/v/dat-ignore.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/dat-ignore
[travis-image]: https://img.shields.io/travis/joehand/dat-ignore.svg?style=flat-square
[travis-url]: https://travis-ci.org/joehand/dat-ignore
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
