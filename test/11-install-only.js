import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import tree from 'strong-npm-ls'
import tap from 'tap'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')
const pkg = path.join(import.meta.dirname, 'deps/install-only')
const pkgJSON = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json')))

tap.test((t) => {
  exec(`node ${bin} install --only=prod`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, `${pkgJSON.name}: install ran without error`)
    tree.read(pkg, (err, out) => {
      t.error(err, `${pkgJSON.name}: tree could be read`)
      const deps = out.dependencies
      t.ok(deps['happy-birthday'], `${pkgJSON.name}: deps are installed`)
      t.end()
    })
  })
})

tap.test((t) => {
  exec(`node ${bin} install --only=dev`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, `${pkgJSON.name}: install ran without error`)
    tree.read(pkg, (err, out) => {
      t.error(err, `${pkgJSON.name}: tree could be read`)
      const deps = out.devDependencies
      t.ok(deps['quack-array'], `${pkgJSON.name}: deps are installed`)
      t.end()
    })
  })
})
