#!/usr/bin/env node

var fs = require('fs')
var http = require('http')
var path = require('path')
var ram = require('random-access-memory')
var hyperdrive = require('hyperdrive')
var discovery = require('hyperdiscovery')
var serve = require('.')

var key = process.argv[2]
var storage = ram
var port = 8080

if (!key) {
  console.log('key or path to a dat required')
  process.exit(1)
}

try {
  fs.stat(path.join(key, '.dat'), function (err, stat) {
    if (err) return start()
    storage = path.join(key, '.dat')
    key = null
    start()
  })
} catch (e) { start() }

function start () {
  var archive = hyperdrive(storage, key, {sparse: true})
  var server = http.createServer(serve(archive, {live: true}))
  server.listen(port)
  console.log(`Visit http://localhost:${port} to see archive`)

  if (key) {
    archive.ready(function () {
      discovery(archive, {live: true})
    })
  }
}
