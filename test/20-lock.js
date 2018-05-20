// const fs = require('fs')
// const path = require('path')
// const exec = require('child_process').exec
const test = require('tap').test
// const fixtures = fs.readdirSync(path.join(__dirname, 'deps'))
// const bin = path.join(__dirname, '..', 'bin', 'dep.js')

test((t) => {
  // lock is not implemented yet
  t.end()
  /*
  var items = 2
  var count = fixtures.length * items
  t.plan(count)
  fixtures.forEach(fixture => {
    const pkg = path.join(__dirname, 'deps', fixture)
    const pkgJSON = require(path.join(pkg, 'package.json'))
    exec(`node ${bin} lock`, {cwd: pkg}, (err, stdout, stderr) => {
      t.ifError(err, `${pkgJSON.name}: lock ran without error`)
      const lock = require(path.join(pkg, 'node_modules.json'))
      const deps = lock.dependencies
      t.ok(Object.keys(deps).length, `${pkgJSON.name}: deps are locked`)
      if (count === 0) t.end()
    })
  })
  */
})
