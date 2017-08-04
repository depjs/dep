# mirror-folder

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]

Small module to mirror a folder to another folder.

Supports watch mode as well where it will continuously watch the src folder and mirror new entries as they are created/removed.

```
npm install mirror-folder
```

## Usage

``` js
var mirror = require('mirror-folder')

mirror('/Users/maf/cool-stuff', '/Users/maf/cool-stuff-mirror', function (err) {
  if (err) throw err
  console.log('Folder was mirrored')
})
```

## API

#### `var progress = mirror(src, dst, [options], [callback])`

Mirror `src` to `dst`. Returns a progress event emitter.

Options include:

``` js
{
  watch: false, // keep watching the src and mirror new entries,
  dereference: false, // dereference any symlinks
  equals: fun, // optional function to determine if two entries are the same, see below
  ignore: null, // optional function to ignore file paths on src or dest
  dryRun: false // emit all events but don't write/del files
}
```

The equals function looks like this:

``` js
function equals (src, dst, cb) {
  console.log('src.name', src.name)
  console.log('src.stat', src.stat)
  console.log('dst.name', dst.name)
  console.log('dst.stat', dst.stat)
  cb(null, true) // callback with true if they are the same or false if not
}
```

Per default the equals function will check if mtime is larger on the src entry or if the size is different

The ignore function looks like this:

``` js
function ignore (file) {
  // ignore any files with secret in them
  if (file.indexOf('secret') > -1) return true
  return false
}
```

If you are using a custom fs module (like [graceful-fs](https://github.com/isaacs/node-graceful-fs)) you can pass that in
with the `src` or `dst` like this:

``` js
mirror({name: '/Users/maf/cool-stuff', fs: customFs}, {name: '/Users/maf/cool-stuff-mirror', fs: anotherFs})
```

#### `progress.on('pending', {name, live})`

Emitted when file/dir added to pending queue.

#### `progress.pending`

Array of items pending to be processed.

#### `progress.on('put', src, dst)`

Emitted when a file/folder is copied from the src to the dst folder.

#### `progress.on('put-data', data)`

Emitted when a file chunk is read from the src.

#### `progress.on('put-end', src, dst)`

Emitted at the end of a write stream (files only).

#### `progress.on('del', dst)`

Emitted when a file/folder is deleted from the dst folder.

#### `progress.on('ignore', src, dst)`

Emitted when a file/folder is ignored (either src or dst).

#### `progress.on('skip', src, dst)`

Emitted when a file/folder is skipped. Either src file already is `equal` to dst file or file does not exist in either place.

#### `progress.on('end')`

Emitted when the mirror ends (not emitted in watch mode). The mirror callback is called when this event is emitted as well

#### `progress.on('error', err)`

Emitted when a critical error happens. If you pass a mirror callback you don't need to listen for this.

#### `progress.destory()`

Stop mirroring files. If using watch mode, close the file watcher.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/mirror-folder.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/mirror-folder
[travis-image]: https://img.shields.io/travis/mafintosh/mirror-folder.svg?style=flat-square
[travis-url]: https://travis-ci.org/mafintosh/mirror-folder
