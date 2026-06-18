import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import tree from 'strong-npm-ls'
import tap from 'tap'

const skip = [
  'install-only',
  'install-save'
]
const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')
const fixtures = fs.readdirSync(path.join(import.meta.dirname, 'deps'))
  .filter((name) => {
    return skip.indexOf(name) === -1
  })

tap.test((t) => {
  const items = 3
  const count = fixtures.length * items
  t.plan(count)
  fixtures.forEach(fixture => {
    const pkg = path.join(import.meta.dirname, 'deps', fixture)
    const pkgJSON = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json')))
    exec(`node ${bin} install`, { cwd: pkg }, (err, stdout, stderr) => {
      t.error(err, `${pkgJSON.name}: install ran without error`)
      tree.read(pkg, (err, out) => {
        t.error(err, `${pkgJSON.name}: tree could be read`)
        const deps = out.dependencies
        t.ok(Object.keys(deps).length, `${pkgJSON.name}: deps are installed`)
        if (count === 0) t.end()
      })
    })
  })
})
