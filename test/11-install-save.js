const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const tree = require('strong-npm-ls')
const test = require('tap').test
const bin = path.join(__dirname, '..', 'bin', 'dep.js')
const pkg = path.join(__dirname, 'deps/custom/install-save')
const pkgJSON = require(path.join(pkg, 'package.json'))

test((t) => {
  exec(`node ${bin} install --save=prod text-table`, {cwd: pkg}, (err, stdout, stderr) => {
    t.ifError(err, `${pkgJSON.name}: install ran without error`)
    tree.read(pkg, (err, out) => {
      t.ifError(err, `${pkgJSON.name}: tree could be read`)
      const deps = out.dependencies
      t.ok(deps['text-table'], `${pkgJSON.name}: deps are installed`)
      t.end()
    })
  })
})

test((t) => {
  exec(`node ${bin} install --save=dev quack-array`, {cwd: pkg}, (err, stdout, stderr) => {
    t.ifError(err, `${pkgJSON.name}: install ran without error`)
    tree.read(pkg, (err, out) => {
      t.ifError(err, `${pkgJSON.name}: tree could be read`)
      const deps = out.devDependencies
      t.ok(deps['quack-array'], `${pkgJSON.name}: deps are installed`)
      t.end()
    })
  })
})

test((t) => {
  var data = pkgJSON
  delete data.dependencies['text-table']
  delete data.devDependencies
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify(data, 2, 2) + '\n')
  t.end()
})
