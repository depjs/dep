const path = require('path')
const exec = require('child_process').exec
const tree = require('strong-npm-ls')
const test = require('tap').test
const bin = path.join(__dirname, '..', 'bin', 'dep.js')
const pkg = path.join(__dirname, 'deps/install-deprecated')
const pkgJSON = require(path.join(pkg, 'package.json'))

test((t) => {
  exec(`node ${bin} install`, { cwd: pkg }, (err, stdout, stderr) => {
    t.ifError(err, `${pkgJSON.name}: install ran without error`)
    t.has(stdout, 'minimatch@0.0.1')
    tree.read(pkg, (err, out) => {
      t.ifError(err, `${pkgJSON.name}: tree could be read`)
      const deps = out.dependencies
      t.ok(deps.minimatch, `${pkgJSON.name}: deps are installed`)
      t.end()
    })
  })
})
