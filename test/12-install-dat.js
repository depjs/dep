const path = require('path')
const exec = require('child_process').exec
const tree = require('strong-npm-ls')
const test = require('tap').test
const Dat = require('dat-node')
const pkg = path.join(__dirname, 'deps/custom/dat')
const bin = path.join(__dirname, '..', 'bin', 'dep.js')
const pkgJSON = require(path.join(pkg, 'package.json'))

test((t) => {
  Dat(path.join(__dirname, 'deps/custom/dat/happy-birthday-0.6.0'), function (err, dat) {
    t.ifError(err)
    dat.importFiles()
    dat.joinNetwork()
    const datLink = 'dat://' + dat.key.toString('hex')
    exec(`node ${bin} install happy-birthday@${datLink}`, {cwd: pkg}, (err, stdout, stderr) => {
      t.ifError(err, `${pkgJSON.name}: install ran without error`)
      dat.close((err) => {
        dat.leaveNetwork()
        t.ifError(err, `closed dat network`)
        tree.read(pkg, (err, out) => {
          t.ifError(err, `${pkgJSON.name}: tree could be read`)
          const deps = out.dependencies
          t.ok(deps['happy-birthday'], `${pkgJSON.name}: deps are installed`)
          t.ifError(err)
          t.end()
        })
      })
    })
  })
})
