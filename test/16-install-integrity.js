import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { exec } from 'child_process'
import tap from 'tap'
import verifyIntegrity from '../lib/utils/integrity.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

const mkProject = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-int-'))
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify({ name: 't', version: '1.0.0', dependencies: { 'is-odd': '^3.0.0' } }))
  return dir
}

tap.test('verifyIntegrity accepts a matching hash and rejects a bad one', (t) => {
  const buf = Buffer.from('hello world')
  const sri = 'sha512-' + crypto.createHash('sha512').update(buf).digest('base64')
  const sha1 = crypto.createHash('sha1').update(buf).digest('hex')

  t.doesNotThrow(() => verifyIntegrity(buf, { integrity: sri }), 'matching sha512 passes')
  t.doesNotThrow(() => verifyIntegrity(buf, { shasum: sha1 }), 'matching sha1 passes')
  t.doesNotThrow(() => verifyIntegrity(buf, {}), 'no expected hash is a no-op')
  t.throws(() => verifyIntegrity(buf, { integrity: 'sha512-' + Buffer.from('nope').toString('base64') }), /Integrity check failed/, 'bad sha512 throws')
  t.throws(() => verifyIntegrity(buf, { shasum: 'deadbeef' }), /Checksum check failed/, 'bad sha1 throws')
  t.end()
})

tap.test('install verifies tarball integrity and succeeds for valid packages', (t) => {
  const dir = mkProject()
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'is-odd', 'package.json')), 'package extracted after passing verification')
    t.end()
  })
})

tap.test('a tampered lockfile integrity fails the install before writing files', (t) => {
  const dir = mkProject()
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')
    const lockPath = path.join(dir, 'package-lock.json')
    const lock = JSON.parse(fs.readFileSync(lockPath))
    lock.packages['node_modules/is-odd'].integrity = 'sha512-' + Buffer.from('tampered').toString('base64')
    fs.writeFileSync(lockPath, JSON.stringify(lock))

    exec(`node ${bin} install`, { cwd: dir }, (err2, stdout, stderr) => {
      t.ok(err2, 'install exits non-zero on an integrity mismatch')
      t.match(stderr, /[Ii]ntegrity check failed/, 'reports the integrity failure')
      t.notOk(fs.existsSync(path.join(dir, 'node_modules', 'is-odd', 'package.json')), 'the corrupt package is not extracted')
      t.end()
    })
  })
})
