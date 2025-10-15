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

    const binStats = fs.lstatSync(binPath)

    if (binStats.isSymbolicLink()) {
      const resolved = fs.realpathSync(binPath)
      t.equal(resolved, resolveBinTarget(), `${packageJson.name}: bin resolves to package script`)

      const stat = fs.statSync(binPath)
      t.ok(isExecutable(stat.mode), `${packageJson.name}: bin entry is executable`)
    } else if (process.platform === 'win32') {
      const cmdShim = `${binPath}.cmd`
      const psShim = `${binPath}.ps1`
      t.ok(fs.existsSync(cmdShim), `${packageJson.name}: cmd shim exists`)
      t.ok(fs.existsSync(psShim), `${packageJson.name}: powershell shim exists`)
      const target = resolveBinTarget()
      const shimContent = fs.readFileSync(cmdShim, 'utf8')
      t.match(
        shimContent.replace(/\\/g, '/'),
        target.replace(/\\/g, '/'),
        `${packageJson.name}: cmd shim points to target script`
      )
      const binContent = fs.readFileSync(binPath, 'utf8')
      const targetContent = fs.readFileSync(target, 'utf8')
      t.equal(binContent, targetContent, `${packageJson.name}: fallback bin matches target content`)
    } else {
      const resolved = fs.realpathSync(binPath)
      t.equal(resolved, resolveBinTarget(), `${packageJson.name}: bin resolves to package script`)

      const stat = fs.statSync(binPath)
      t.ok(isExecutable(stat.mode), `${packageJson.name}: bin entry is executable`)
    }

    t.end()
  })
})
