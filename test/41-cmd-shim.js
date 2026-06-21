import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'
import cmdShim from '../lib/utils/cmd-shim.js'

// cmd-shim writes the sh/.cmd/.ps1 shim trio for a package bin. It only runs as
// part of an install on Windows, so exercise it directly here across its shapes:
// a bin with an interpreter shebang, one without, and one carrying env vars.

const mkdir = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-shim-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  return dir
}

tap.test('cmd-shim writes the shim trio for a bin with an interpreter shebang', async (t) => {
  const dir = mkdir(t)
  const from = path.join(dir, 'cli.js')
  const to = path.join(dir, 'bin', 'cli')
  fs.writeFileSync(from, '#!/usr/bin/env node\nconsole.log(1)\n')

  await cmdShim(from, to)

  t.ok(fs.existsSync(to), 'sh shim written')
  t.ok(fs.existsSync(to + '.cmd'), 'cmd shim written')
  t.ok(fs.existsSync(to + '.ps1'), 'ps1 shim written')
  const sh = fs.readFileSync(to, 'utf8')
  t.match(sh, /^#!\/bin\/sh/, 'sh shim starts with the sh shebang')
  t.match(sh, /PROG_EXE=/, 'sh shim resolves the node interpreter')
  const cmd = fs.readFileSync(to + '.cmd', 'utf8')
  t.match(cmd, /@ECHO off/, 'cmd shim has the batch header')
  t.match(cmd, /_prog=%dp0%\\node\.exe/, 'cmd shim points at the interpreter')
  t.match(fs.readFileSync(to + '.ps1', 'utf8'), /Test-Path/, 'ps1 shim probes the interpreter')
  t.end()
})

tap.test('cmd-shim writes shims that exec the target directly when there is no shebang', async (t) => {
  const dir = mkdir(t)
  const from = path.join(dir, 'binary')
  const to = path.join(dir, 'binary-bin')
  fs.writeFileSync(from, 'plain-binary-without-a-shebang\n')

  await cmdShim(from, to)

  const sh = fs.readFileSync(to, 'utf8')
  t.match(sh, /exec "\$basedir\/binary"/, 'sh shim execs the target with no interpreter')
  t.notOk(/PROG_EXE=/.test(sh), 'no interpreter resolution block')
  t.end()
})

tap.test('cmd-shim carries environment variables from the shebang', async (t) => {
  const dir = mkdir(t)
  const from = path.join(dir, 'env.js')
  const to = path.join(dir, 'env-bin')
  fs.writeFileSync(from, '#!/usr/bin/env FOO=$BAR node\nx\n')

  await cmdShim(from, to)

  t.match(fs.readFileSync(to + '.cmd', 'utf8'), /@SET FOO=%BAR%/, 'cmd shim sets the var, $ converted to %')
  t.match(fs.readFileSync(to, 'utf8'), /exec FOO=\$BAR /, 'sh shim exports the var before exec')
  t.end()
})

tap.test('cmd-shim falls back to a plain shim when the source is unreadable', async (t) => {
  const dir = mkdir(t)
  const from = path.join(dir, 'asdir')
  const to = path.join(dir, 'dir-bin')
  fs.mkdirSync(from)

  await cmdShim(from, to)

  t.ok(fs.existsSync(to) && fs.existsSync(to + '.cmd') && fs.existsSync(to + '.ps1'),
    'still writes the shim trio')
  t.end()
})

tap.test('cmd-shim rejects when the source bin does not exist', async (t) => {
  const dir = mkdir(t)
  await t.rejects(
    cmdShim(path.join(dir, 'missing'), path.join(dir, 'missing-bin')),
    /ENOENT/,
    'a missing source surfaces the stat error'
  )
  t.end()
})
