# recursive-watch

Minimal recursive file watcher.

Uses the native recursive `fs.watch` option on macOS/Windows and basic recursive dir watching on Linux

```
npm install recursive-watch
```

## Usage

``` js
var watch = require('recursive-watch')

watch('./a-file-or-directory', function (filename) {
  console.log('something changed with', filename)
})
```

## API

#### `var unwatch = watch(path, onchange)`

Watch a directory or filename. Calls the `onchange` function if the path changed in anyway.
Call the `unwatch` function to stop watching the path.

## License

MIT
