import path from 'path'
import tap from './helpers/tap.js'
import which from '../lib/utils/which.js'

// which resolves a command to an executable path: an explicit path is used as
// is, otherwise PATH is searched. Missing commands reject (async) / throw (sync).

tap.test('which.sync resolves an explicit path and a PATH lookup', (t) => {
  t.equal(which.sync(process.execPath), process.execPath, 'an explicit executable path is returned as is')
  t.ok(which.sync('node') || which.sync(path.basename(process.execPath)), 'a bare command is found on PATH')
  t.end()
})

tap.test('which.sync throws for a missing command', (t) => {
  t.throws(() => which.sync('/no/such/executable-xyz'), /not found/, 'a missing explicit path throws')
  t.throws(() => which.sync('definitely-not-a-real-command-xyz'), /not found/, 'a missing PATH command throws')
  t.end()
})

tap.test('which resolves and rejects asynchronously', async (t) => {
  t.equal(await which(process.execPath), process.execPath, 'resolves an explicit path')
  await t.rejects(which('definitely-not-a-real-command-xyz'), /not found/, 'rejects a missing command')
  t.end()
})
