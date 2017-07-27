const fs = require('fs')
const path = require('path')
const test = require('tap').test
const rimraf = require('rimraf')
const fixtures = fs.readdirSync(path.join(__dirname, 'fixtures'))

test((t) => {
  var count = fixtures.length
  t.plan(count)
  fixtures.forEach(fixture => {
    const modules = path.join(__dirname, 'fixtures', fixture, 'node_modules')
    rimraf(modules, _ => {
      count -= 1
      t.pass()
      if (count === 0) t.end()
    })
  })
})
