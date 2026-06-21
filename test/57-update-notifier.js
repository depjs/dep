import fs from 'fs'
import tap from './helpers/tap.js'
import updateNotifier, { cacheFile, readCache, writeCache } from '../lib/utils/update-notifier.js'

// update-notifier persists a tiny cache and prints a notice when a newer version
// was seen by a previous run. It is disabled under CI/NODE_ENV=test, so the test
// temporarily clears those — and backs up/restores the real cache file so it is
// non-destructive.

tap.test('update-notifier caches and notifies about a newer version', (t) => {
  const had = fs.existsSync(cacheFile)
  const backup = had ? fs.readFileSync(cacheFile) : null
  const saved = {
    CI: process.env.CI,
    NODE_ENV: process.env.NODE_ENV,
    NO_UPDATE_NOTIFIER: process.env.NO_UPDATE_NOTIFIER
  }
  const savedWrite = process.stderr.write
  const restoreEnv = (key) => {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
  t.teardown(() => {
    process.stderr.write = savedWrite
    Object.keys(saved).forEach(restoreEnv)
    if (had) fs.writeFileSync(cacheFile, backup)
    else fs.rmSync(cacheFile, { force: true })
  })

  // writeCache + readCache round-trip. A recent lastCheck keeps the notifier
  // from spawning a background refresh.
  writeCache({ lastCheck: Date.now(), latest: '999.0.0' })
  t.equal(readCache().latest, '999.0.0', 'writeCache and readCache round-trip')

  // Enable the notifier and capture what it writes.
  delete process.env.CI
  delete process.env.NODE_ENV
  delete process.env.NO_UPDATE_NOTIFIER
  let out = ''
  process.stderr.write = (chunk) => { out += chunk; return true }
  updateNotifier({ name: 'dep', version: '1.0.0' })
  process.stderr.write = savedWrite

  t.match(out, /Update available 1\.0\.0 → 999\.0\.0/, 'notifies about the cached newer version')
  t.match(out, /npm i -g dep/, 'tells the user how to update')
  t.end()
})

tap.test('update-notifier stays silent when disabled', (t) => {
  const savedCI = process.env.CI
  const savedWrite = process.stderr.write
  t.teardown(() => {
    process.stderr.write = savedWrite
    if (savedCI === undefined) delete process.env.CI
    else process.env.CI = savedCI
  })
  process.env.CI = '1'
  let out = ''
  process.stderr.write = (chunk) => { out += chunk; return true }
  updateNotifier({ name: 'dep', version: '1.0.0' })
  process.stderr.write = savedWrite
  t.equal(out, '', 'no output under CI')
  t.end()
})
