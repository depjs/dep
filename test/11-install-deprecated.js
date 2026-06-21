import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import tree from './helpers/tree.js'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')
const pkg = path.join(import.meta.dirname, 'deps/install-deprecated')
const pkgJSON = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json')))

tap.test((t) => {
  exec(`node ${bin} install`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, `${pkgJSON.name}: install ran without error`)
    t.match(stdout, /minimatch@0\.0\.1/)
    tree.read(pkg, (err, out) => {
      t.error(err, `${pkgJSON.name}: tree could be read`)
      const deps = out.dependencies
      t.ok(deps.minimatch, `${pkgJSON.name}: deps are installed`)
      t.end()
    })
  })
})
