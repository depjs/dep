import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from 'tap'
import resolveTree from '../lib/utils/resolve-tree.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

const mkProject = (deps) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-plat-'))
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify({ name: 't', version: '1.0.0', dependencies: deps }))
  return dir
}

// fsevents is darwin-only; as a *required* dependency it must fail off-darwin.
tap.test('a required dependency for another platform fails the install', { skip: process.platform === 'darwin' ? 'on darwin fsevents is supported' : false }, (t) => {
  const dir = mkProject({ fsevents: '^2.3.2' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))

  exec(`node ${bin} install`, { cwd: dir }, (err, stdout, stderr) => {
    t.ok(err, 'install exits non-zero')
    t.match(stderr, /Unsupported platform/, 'reports the platform mismatch')
    t.notOk(fs.existsSync(path.join(dir, 'node_modules', 'fsevents', 'package.json')), 'the mismatched package is not installed')
    t.end()
  })
})

tap.test('os/cpu mismatch is enforced for required deps but skipped for optional ones', async (t) => {
  const fake = async (name) => ({
    type: 'registry',
    version: '1.0.0',
    os: ['definitely-not-this-os'],
    tarball: 'http://example.invalid/x.tgz'
  })

  // required -> throws
  global.dependenciesTree = {}
  await t.rejects(
    Promise.all([resolveTree({ x: '^1.0.0' }, fake, { skipPlatform: true })]),
    /Unsupported platform/,
    'required platform mismatch rejects'
  )

  // optional -> skipped, no entry placed
  global.dependenciesTree = {}
  await Promise.all([resolveTree({ x: '^1.0.0' }, fake, { skipPlatform: true, optional: new Set(['x']) })])
  t.notOk(global.dependenciesTree.x, 'optional platform mismatch is skipped')
  t.end()
})

tap.test('engines are a warning by default and an error under engine-strict', async (t) => {
  const fake = async (name) => ({ type: 'registry', version: '1.0.0', engines: { node: '^0.10.0' } })

  // default: warn, still placed
  global.dependenciesTree = {}
  await Promise.all([resolveTree({ x: '^1.0.0' }, fake, { checkEngines: true })])
  t.ok(global.dependenciesTree.x, 'default engine check warns but installs')

  // strict: error
  global.dependenciesTree = {}
  await t.rejects(
    Promise.all([resolveTree({ x: '^1.0.0' }, fake, { checkEngines: true, engineStrict: true })]),
    /Unsupported engine/,
    'engine-strict rejects'
  )
  t.end()
})
