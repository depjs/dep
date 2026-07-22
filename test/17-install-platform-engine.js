import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'
import resolveTree from '../lib/utils/resolve-tree.js'
import matchesPlatform from '../lib/utils/platform.js'

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
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

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

  // libc is matched like os/cpu (the current libc is glibc/musl on Linux and
  // absent elsewhere, so a bogus family mismatches everywhere)
  const fakeLibc = async (name) => ({
    type: 'registry',
    version: '1.0.0',
    os: [process.platform],
    cpu: [process.arch],
    libc: ['definitely-not-this-libc'],
    tarball: 'http://example.invalid/x.tgz'
  })
  global.dependenciesTree = {}
  await Promise.all([resolveTree({ x: '^1.0.0' }, fakeLibc, { skipPlatform: true, optional: new Set(['x']) })])
  t.notOk(global.dependenciesTree.x, 'optional libc mismatch is skipped')
  t.end()
})

// npm accepts a scalar os/cpu/libc (sass-embedded-linux-x64 ships
// `"libc": "glibc"`) and treats a lone "any" as no restriction at all.
tap.test('scalar and "any" platform fields are matched like npm does', async (t) => {
  t.ok(matchesPlatform({ libc: 'definitely-not-this-libc' }) === false, 'a scalar libc mismatches without throwing')
  t.ok(matchesPlatform({ os: process.platform }), 'a scalar os matches the current platform')
  t.ok(matchesPlatform({ os: 'definitely-not-this-os' }) === false, 'a scalar os mismatches')
  t.ok(matchesPlatform({ os: ['any'], cpu: ['any'] }), '"any" imposes no restriction')
  t.ok(matchesPlatform({ os: 'any' }), 'a scalar "any" imposes no restriction')

  // the scalar form used to throw out of the tree walk, aborting the install
  const fake = async (name) => ({
    type: 'registry',
    version: '1.0.0',
    os: process.platform,
    cpu: process.arch,
    libc: 'any',
    tarball: 'http://example.invalid/x.tgz'
  })
  global.dependenciesTree = {}
  await Promise.all([resolveTree({ x: '^1.0.0' }, fake, { skipPlatform: true })])
  t.ok(global.dependenciesTree.x, 'a matching package with scalar fields installs')
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
