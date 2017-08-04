# Hyperdrive Http

Serve a [hyperdrive](https://github.com/mafintosh/hyperdrive) archive over HTTP. For an example of use, see [dat.haus](https://github.com/juliangruber/dat.haus).

[![Travis](https://api.travis-ci.org/joehand/hyperdrive-http.svg)](https://travis-ci.org/joehand/hyperdrive-http)

## Usage

Hyperdrive-http returns a function to call when you receive a http request:

```js
var server = http.createServer()
server.on('request', hyperdriveHttp(archive))
```

### Setup

To use hyperdrive-http you will need to:

* Create your own http server
* Setup your hyperdrive archive
* For remote archives, connect to the swarm

## API

Hyperdrive works with many archives/feeds or a single archive.

#### Options

- `exposeHeaders` - If set to `true`, hyperdrive-http will add custom `Hyperdrive-` HTTP headers to directory listing requests (default: `false`):
  ```http
  Hyperdrive-Key: de2a51bbaf8a5545eff82c999f15e1fd29637b3f16db94633cb6e2e0c324f833
  Hyperdrive-Version: 4
  ```
- `live` - If set to `true` will reload a directly listing if the archive receives updates.
- `footer` - Add a footer to your HTML page. Automatically adds archive version number to footer.

### URL Format

Hyperdrive-http responds to any URL with a specific format. If the URL does cannot be parsed, it will return a 404.

* Get archive listing: `http://archive-example.com/`
* Get file from archive: `http://archive-example.com/filename.pdf`

If a directory in the archive contains an `index.html` page that file is returned instead of the directory listing.

## CLI

There is also a CLI that can be used for demo + testing. Pass it a dat link or a path to an existing dat folder:

```
node cli.js <dat-key>
node cli.js /path/do/existing/dat
```
