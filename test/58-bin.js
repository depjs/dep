import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'

// bin links a package's executables into node_modules/.bin. nm resolves the
// node_modules path from cwd once at import time, so chdir into a single
// scratch dir up front and reuse it across cases (each uses distinct names).
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-bin-'))
const cwd = process.cwd()
process.chdir(root)
const { default: bin } = await import('../lib/install/installer/bin.js')
const dotbin = path.join(root, 'node_modules', '.bin')

const teardown = (t) => t.teardown(() => {
  process.chdir(cwd)
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
})

const pkg = (name, binField) => {
  const target = path.join(root, 'node_modules', ...name.split('/'))
  fs.mkdirSync(target, { recursive: true })
  fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name, bin: binField }))
  const files = typeof binField === 'string' ? [binField] : Object.values(binField || {})
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true })
    fs.writeFileSync(path.join(target, file), '#!/usr/bin/env node\n')
  }
  return target
}

tap.test('bin strips the scope when a scoped package has a string bin', async (t) => {
  const target = pkg('@babel/parser', './bin/babel-parser.js')

  await bin('@babel/parser', target)

  const linked = path.join(dotbin, 'parser')
  t.ok(fs.existsSync(linked), 'links as .bin/parser, not .bin/@babel/parser')
  t.notOk(fs.existsSync(path.join(dotbin, '@babel')),
    'no @babel subdir is created under .bin')
  const source = path.join(target, 'bin', 'babel-parser.js')
  if (process.platform === 'win32') {
    // On Windows bin() writes cmd-shim scripts, not symlinks: assert the sh
    // shim references the source by relative path and the .cmd twin exists.
    const rel = path.relative(dotbin, source).split(path.sep).join('/')
    t.ok(fs.readFileSync(linked, 'utf8').includes(rel),
      'shim points at the package bin')
    t.ok(fs.existsSync(linked + '.cmd'), 'creates the .cmd shim')
  } else {
    t.equal(fs.readlinkSync(linked), source, 'symlink points at the package bin')
  }
  t.end()
})

tap.test('bin links an unscoped string bin under the package name', async (t) => {
  const target = pkg('rimraf', './bin.js')

  await bin('rimraf', target)

  t.ok(fs.existsSync(path.join(dotbin, 'rimraf')), 'links as .bin/rimraf')
  t.end()
})

tap.test('bin links each command of an object bin by its key', async (t) => {
  const target = pkg('@scope/tool', { foo: './foo.js', bar: './bar.js' })

  await bin('@scope/tool', target)

  t.ok(fs.existsSync(path.join(dotbin, 'foo')), 'links foo')
  t.ok(fs.existsSync(path.join(dotbin, 'bar')), 'links bar')
  t.end()
})

tap.test('bin does nothing when the package has no bin field', async (t) => {
  const target = pkg('no-bin')
  fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name: 'no-bin' }))

  await bin('no-bin', target)

  t.notOk(fs.existsSync(path.join(dotbin, 'no-bin')), 'no symlink is created')
  teardown(t)
  t.end()
})
