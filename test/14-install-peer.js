import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from 'tap'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

const mkProject = (deps) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-peer-'))
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify({ name: 't', version: '1.0.0', dependencies: deps }))
  return dir
}

// ajv-keywords@5 declares a (non-optional) peerDependency on ajv@^8.
tap.test('install auto-installs non-optional peerDependencies at the top level', (t) => {
  const dir = mkProject({ 'ajv-keywords': '^5.1.0' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'ajv-keywords')), 'the package itself is installed')
    const ajv = JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', 'ajv', 'package.json')))
    t.match(ajv.version, /^8\./, 'its peer dependency (ajv@8) is hoisted to the top level')
    t.end()
  })
})

tap.test('lock records the auto-installed peer as a package and keeps peerDependencies', (t) => {
  const dir = mkProject({ 'ajv-keywords': '^5.1.0' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')
    const pkgs = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8')).packages
    t.ok(pkgs['node_modules/ajv'], 'peer dependency is locked as a package')
    t.same(pkgs['node_modules/ajv-keywords'].peerDependencies, { ajv: '^8.8.2' }, 'peerDependencies recorded on the depender')
    t.notOk((pkgs['node_modules/ajv-keywords'].dependencies || {}).ajv, 'peer is not duplicated into dependencies')
    t.end()
  })
})
