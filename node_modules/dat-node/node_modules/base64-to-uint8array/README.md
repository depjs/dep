# base64-to-uint8array

Convert a base64 string to a Uint8Array in Node and the browser

```
npm install base64-to-uint8array
```

## Usage

``` js
var toUint8Array = require('base64-to-uint8array')
var arr = toUint8Array('aGVsbG8gd29ybGQ=')
console.log(arr) // the bytes for "hello world"
```

## License

MIT
