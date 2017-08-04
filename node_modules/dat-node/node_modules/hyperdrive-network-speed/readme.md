# hyperdrive-network-speed

[![Travis](https://img.shields.io/travis/joehand/hyperdrive-network-speed.svg?style=flat-square)](https://travis-ci.org/joehand/hyperdrive-network-speed) [![npm](https://img.shields.io/npm/v/hyperdrive-network-speed.svg?style=flat-square)](https://npmjs.org/package/hyperdrive-network-speed)

Get upload and download speeds for a hyperdrive archive.

## Usage

```js
var archive = hyperdrive('.dat')
var swarm = hyperdiscovery(archive)
var speed = networkSpeed(archive, {timeout: 1000})

setInterval(function () {
  console.log('upload speed: ', speed.uploadSpeed)
  console.log('download speed: ', speed.downloadSpeed)
}, 500)
```

## API

### `var speed = networkSpeed(archive, [opts])`

* `archive` is a hyperdrive archive.
* `opts.timeout` is the only option. Speed will be reset to zero after the timeout.

#### `speed.uploadSpeed`

Archive upload speed across all peers.

#### `speed.downloadSpeed`

Archive download speed across all peers.

## License

MIT
