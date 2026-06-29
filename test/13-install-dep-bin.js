import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

// Regression: a dependency's lifecycle script must be able to invoke bins
// provided by its own (hoisted) dependencies. Those bins are linked into the
// nearest ancestor node_modules/.bin (usually the project root), not the
// package's own, so the script's PATH has to include every ancestor's .bin —
// e.g. unrs-resolver's postinstall calls the `napi-postinstall` bin hoisted to
// the root node_modules/.bin.
tap.test('a dependency lifecycle script can run a hoisted dependency bin', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-depbin-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  const write = (rel, obj) => {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, typeof obj === 'string' ? obj : JSON.stringify(obj))
  }

  // `has-bin` exposes a bin that drops a marker in the cwd it runs from.
  write('has-bin/cli.js',
    '#!/usr/bin/env node\n' +
    "require('fs').writeFileSync(require('path').join(process.cwd(), 'bin-ran.txt'), 'ok')\n")
  write('has-bin/package.json', { name: 'has-bin', version: '1.0.0', bin: { 'dep-marker-bin': './cli.js' } })

  // `parent` depends on `has-bin` (hoisted to the root .bin) and calls its bin
  // from its own postinstall.
  write('parent/package.json', {
    name: 'parent',
    version: '1.0.0',
    dependencies: { 'has-bin': path.join(dir, 'has-bin') },
    scripts: { postinstall: 'dep-marker-bin' }
  })

  write('package.json', {
    name: 'root',
    version: '1.0.0',
    private: true,
    dependencies: { parent: path.join(dir, 'parent') }
  })

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error (hoisted bin was on PATH)')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'has-bin')), 'hoisted dependency installed at root')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'parent', 'bin-ran.txt')), 'postinstall invoked the hoisted bin')
    t.end()
  })
})
