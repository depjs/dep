const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const tree = require('strong-npm-ls')
const test = require('tap').test
const fixtures = fs.readdirSync(path.join(__dirname, 'fixtures'))

test((t) => {
  var items = 3
  var count = fixtures.length * items
  t.plan(count)
  fixtures.forEach(fixture => {
    const bin = path.join(__dirname, '..', 'bin', 'dep.js')
    const pkg = path.join(__dirname, 'fixtures', fixture)
    const pkgJSON = require(path.join(pkg, 'package.json'))
    exec(`node ${bin} install`, {cwd: pkg}, (err, stdout, stderr) => {
      t.ifError(err, `${pkgJSON.name}: dep ran without error`)
      tree.read(pkg, (err, out) => {
        t.ifError(err, `${pkgJSON.name}: tree could be read`)
        const deps = out.dependencies
        t.is(Object.keys(deps).length, 2, `${pkgJSON.name}: two deps are installed`)
        if (count === 0) t.end()
      })
    })
  })
})
