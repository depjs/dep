import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

// native-hello-world@1 is a nan-era addon that cannot compile against any
// Node.js version dep supports (its V8 API calls are long gone), which makes
// it a stable "native build always fails" fixture — whether the failure is
// the compiler erroring or node-gyp being absent entirely.
const mkProject = (field) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-native-'))
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 't', version: '1.0.0', [field]: { 'native-hello-world': '^1.0.0' }
  }))
  return dir
}

const teardown = (t, dir) => t.teardown(() =>
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

tap.test('a required dependency that fails to build fails the install', (t) => {
  const dir = mkProject('dependencies')
  teardown(t, dir)
  exec(`node ${bin} install`, { cwd: dir }, (err, stdout, stderr) => {
    t.ok(err, 'install exits non-zero')
    t.match(stderr, /Native build failed for native-hello-world/,
      'the error names the package')
    t.end()
  })
})

tap.test('an optional dependency that fails to build is skipped silently', (t) => {
  const dir = mkProject('optionalDependencies')
  teardown(t, dir)
  exec(`node ${bin} install`, { cwd: dir }, (err, stdout, stderr) => {
    t.error(err, 'install succeeds')
    t.notOk(fs.existsSync(path.join(dir, 'node_modules', 'native-hello-world')),
      'the failed package is removed')
    t.notOk(/Native build failed|error/.test(stderr),
      'nothing about the failure is printed')
    t.end()
  })
})
