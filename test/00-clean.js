const fs = require('fs')
const path = require('path')
const test = require('tap').test
const rimraf = require('rimraf')
const fixtures = fs.readdirSync(path.join(__dirname, 'deps'))

test((t) => {
  var count = fixtures.length
  fixtures.forEach(fixture => {
    const modules = path.join(__dirname, 'deps', fixture, 'node_modules')
    const lock = path.join(__dirname, 'deps', fixture, 'node_modules.json')
    rimraf.sync(modules)
    rimraf.sync(lock)
    count -= 1
    if (count === 0) t.end()
  })
})
