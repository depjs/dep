# corsify

<!--
    [![build status][1]][2]
    [![NPM version][3]][4]
    [![Coverage Status][5]][6]
    [![gemnasium Dependency Status][7]][8]
    [![Davis Dependency status][9]][10]
-->

<!-- [![browser support][11]][12] -->

CORS up a route handler

## Example

```js
var Corsify = require("corsify")
var http = require("http")

// cors headers set
http.createServer(Corsify(function (req, res) {
  console.log("sweet")
})).listen(8000)
```

## Example creating shared corsify

```js
var Corsify = require("corsify")
var Router = require("routes-router")

var cors = Corsify({
    "Access-Control-Allow-Methods": "POST, GET"
})

var app = Router()
app.addRoute("/users", cors(function (req, res) {
  res.end("users")
}))
app.addRoute("/posts", cors(function (req, res) {
  res.end("posts")
}))
app.addRoute("/api", Corsify({
  "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE"
}, function (req, res) {
  res.end("api")
}))

http.createServer(app).listen(8000)
```

## Documentation

`Corsify(opts: Object, handler: (req, res)) => (req, res)`

`Corsify` can be called with options

```js
var opts = {
    // if this is set to false then preflight `OPTIONS` is
    // not terminated
    endOptions: Boolean,
    // if you want to compute the allowed origin manually you
    // pass in a getOrigin function
    getOrigin: (req, res) => String,
    // these are default header values you can set. Corsify
    // has sensible defaults. You can't use Allow-Origin and
    // getOrigin at the same time.
    "Access-Control-Allow-Origin": String,
    "Access-Control-Allow-Methods": String,
    "Access-Control-Allow-Credentials": String
    "Access-Control-Allow-Max-Age": String,
    "Access-Control-Allow-Headers": String
}
```

## Installation

`npm install corsify`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://secure.travis-ci.org/Raynos/corsify.png
  [2]: https://travis-ci.org/Raynos/corsify
  [3]: https://badge.fury.io/js/corsify.png
  [4]: https://badge.fury.io/js/corsify
  [5]: https://coveralls.io/repos/Raynos/corsify/badge.png
  [6]: https://coveralls.io/r/Raynos/corsify
  [7]: https://gemnasium.com/Raynos/corsify.png
  [8]: https://gemnasium.com/Raynos/corsify
  [9]: https://david-dm.org/Raynos/corsify.png
  [10]: https://david-dm.org/Raynos/corsify
  [11]: https://ci.testling.com/Raynos/corsify.png
  [12]: https://ci.testling.com/Raynos/corsify
