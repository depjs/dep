import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from 'tap'
import npa from '../lib/utils/npa.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

const mkProject = (deps) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-alias-'))
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify({ name: 't', version: '1.0.0', dependencies: deps }))
  return dir
}

tap.test('npa parses npm: aliases to the target package', (t) => {
  const r = npa('odd@npm:is-odd@^3.0.0')
  t.equal(r.type, 'range', 'resolves to a registry range')
  t.equal(r.alias, 'is-odd', 'alias points at the real package')
  t.equal(r.escapedName, 'is-odd', 'fetches the real package')
  t.equal(r.fetchSpec, '^3.0.0', 'uses the target spec')

  const scoped = npa('x@npm:@scope/y@1.0.0')
  t.equal(scoped.alias, '@scope/y', 'scoped alias target parsed')
  t.equal(scoped.escapedName, '@scope%2fy', 'scoped target escaped for the registry')
  t.end()
})

tap.test('install resolves an alias under its own name', (t) => {
  const dir = mkProject({ odd: 'npm:is-odd@^3.0.0' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error')
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', 'odd', 'package.json')))
    t.equal(pkg.name, 'is-odd', 'the aliased package is installed under node_modules/odd')
    t.match(pkg.version, /^3\./, 'the target version range is honoured')
    t.end()
  })
})

tap.test('lock records the alias with the real package name (npm style)', (t) => {
  const dir = mkProject({ odd: 'npm:is-odd@^3.0.0' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')
    const lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8'))
    t.equal(lock.packages[''].dependencies.odd, 'npm:is-odd@^3.0.0', 'root keeps the alias spec')
    const entry = lock.packages['node_modules/odd']
    t.equal(entry.name, 'is-odd', 'entry records the real package name')
    t.match(entry.version, /^3\./, 'entry has the resolved version')
    t.match(entry.resolved, /is-odd/, 'resolved points at the real tarball')
    t.end()
  })
})
