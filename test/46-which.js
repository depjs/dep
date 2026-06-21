import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'
import which from '../lib/utils/which.js'

// which resolves a command to an executable path: an explicit path is used as
// is, otherwise PATH is searched. Missing commands reject (async) / throw (sync).

const isWin = process.platform === 'win32'

// Create an executable in a temp dir. On Windows the lookup appends a PATHEXT
// extension, so the query path omits it (and the resolved path adds it back).
const makeExe = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-which-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  if (isWin) {
    fs.writeFileSync(path.join(dir, 'tool.cmd'), '@echo off\r\n')
    return path.join(dir, 'tool')
  }
  const exe = path.join(dir, 'tool')
  fs.writeFileSync(exe, '#!/bin/sh\n')
  fs.chmodSync(exe, 0o755)
  return exe
}

tap.test('which.sync resolves an explicit path and a PATH lookup', (t) => {
  const query = makeExe(t)
  t.ok(fs.existsSync(which.sync(query)), 'an explicit path resolves to the executable')
  t.ok(which.sync('node'), 'a bare command is found on PATH')
  t.end()
})

tap.test('which.sync throws for a missing command', (t) => {
  t.throws(() => which.sync('/no/such/executable-xyz'), /not found/, 'a missing explicit path throws')
  t.throws(() => which.sync('definitely-not-a-real-command-xyz'), /not found/, 'a missing PATH command throws')
  t.end()
})

tap.test('which resolves and rejects asynchronously', async (t) => {
  const query = makeExe(t)
  t.ok(await which(query), 'resolves an explicit path')
  await t.rejects(which('definitely-not-a-real-command-xyz'), /not found/, 'rejects a missing command')
  t.end()
})
