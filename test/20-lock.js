const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const test = require('tap').test
const fixtures = fs.readdirSync(path.join(__dirname, 'fixtures'))

test((t) => {
  var items = 2
  var count = fixtures.length * items
  t.plan(count)
  fixtures.forEach(fixture => {
    const bin = path.join(__dirname, '..', 'bin', 'dep.js')
    const pkg = path.join(__dirname, 'fixtures', fixture)
    const pkgJSON = require(path.join(pkg, 'package.json'))
    exec(`node ${bin} lock`, {cwd: pkg}, (err, stdout, stderr) => {
      t.ifError(err, `${pkgJSON.name}: lock ran without error`)
      const lock = require(path.join(pkg, 'node_modules.json'))
      const deps = lock.dependencies
      t.is(Object.keys(deps).length, 2, `${pkgJSON.name}: two deps are installed`)
      if (count === 0) t.end()
    })
  })
})
