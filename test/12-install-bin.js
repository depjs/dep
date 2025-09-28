const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const test = require('tap').test

const bin = path.join(__dirname, '..', 'bin', 'dep.js')
const pkg = path.join(__dirname, 'deps', 'install-bin')
const packageJson = require(path.join(pkg, 'package.json'))

const resolveBinTarget = () => path.join(pkg, 'node_modules', 'happy-birthday', 'happy-birthday.js')
const resolveBinPath = () => path.join(pkg, 'node_modules', '.bin', 'happy-birthday')

const isExecutable = (mode) => (mode & 0o111) !== 0

test((t) => {
  exec(`node ${bin} install`, { cwd: pkg }, (err) => {
    t.error(err, `${packageJson.name}: install ran without error`)
    const binPath = resolveBinPath()
    t.ok(fs.existsSync(binPath), `${packageJson.name}: happy-birthday bin exists`)

    if (process.platform !== 'win32') {
      const linkStats = fs.lstatSync(binPath)
      t.ok(linkStats.isSymbolicLink(), `${packageJson.name}: bin entry is a symlink`)
    }

    const resolved = fs.realpathSync(binPath)
    t.equal(resolved, resolveBinTarget(), `${packageJson.name}: bin resolves to package script`)

    if (process.platform !== 'win32') {
      const stat = fs.statSync(binPath)
      t.ok(isExecutable(stat.mode), `${packageJson.name}: bin entry is executable`)
    }

    t.end()
  })
})
