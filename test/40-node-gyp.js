import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'
import nodeGyp from '../lib/utils/node-gyp.js'
import which from '../lib/utils/which.js'

// A tiny N-API addon (ABI-stable, so it builds on any modern Node) written to a
// temp dir — kept out of test/deps so the install/clean fixture sweeps ignore it.
const addonC = `#include <node_api.h>

static napi_value Init(napi_env env, napi_value exports) {
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
`

const bindingGyp = JSON.stringify({
  targets: [{ target_name: 'addon', sources: ['addon.c'] }]
})

const hasGyp = (() => {
  try { which.sync('node-gyp'); return true } catch (e) {}
  try { which.sync('npm'); return true } catch (e) {}
  return false
})()

tap.test('node-gyp builds a native addon via shell-out', {
  skip: hasGyp ? false : 'node-gyp/npm not available'
}, (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-gyp-'))
  fs.writeFileSync(path.join(dir, 'addon.c'), addonC)
  fs.writeFileSync(path.join(dir, 'binding.gyp'), bindingGyp)
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ private: true, name: 'addon', version: '1.0.0' })
  )

  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  t.doesNotThrow(
    () => nodeGyp({ cwd: dir, stdio: 'ignore' }),
    'node-gyp rebuild runs without throwing'
  )
  t.ok(
    fs.existsSync(path.join(dir, 'build', 'Release', 'addon.node')),
    'addon.node artifact was produced'
  )
  t.end()
})

tap.test('node-gyp reports a helpful error when it cannot be located', (t) => {
  const savedPath = process.env.PATH
  process.env.PATH = ''
  t.teardown(() => { process.env.PATH = savedPath })

  t.throws(
    () => nodeGyp({ cwd: process.cwd(), stdio: 'ignore' }),
    /node-gyp not found/,
    'throws a clear "node-gyp not found" error'
  )
  t.end()
})
