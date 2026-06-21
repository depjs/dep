import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'
import lifecycle, { runCmd, binEnv } from '../lib/utils/lifecycle.js'
import PATH from '../lib/utils/path-key.js'

tap.test('runCmd resolves on exit 0 and rejects otherwise', async (t) => {
  await runCmd(process.execPath, ['-e', 'process.exit(0)'], {})
  t.pass('a zero exit resolves')
  await t.rejects(
    runCmd(process.execPath, ['-e', 'process.exit(3)'], {}),
    /exit code 3/,
    'a non-zero exit rejects with the code'
  )
  t.end()
})

tap.test('binEnv puts the local node_modules/.bin first on PATH', (t) => {
  const env = binEnv('/tmp/project')
  const first = env[PATH].split(path.delimiter)[0]
  t.equal(first, path.join('/tmp/project', 'node_modules', '.bin'), 'local .bin is prepended')
  t.end()
})

tap.test('lifecycle runs only the present scripts and reports whether any ran', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-life-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  const stamp = path.join(dir, 'ran.txt')
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 't',
    version: '1.0.0',
    scripts: { postinstall: `node -e "require('fs').writeFileSync('${stamp.replace(/\\/g, '\\\\')}','ok')"` }
  }))

  const ran = await lifecycle(dir, ['preinstall', 'postinstall'])
  t.ok(ran, 'returns true when a script ran')
  t.ok(fs.existsSync(stamp), 'the present script (postinstall) executed')
  t.end()
})

tap.test('lifecycle returns false when there is no package.json', async (t) => {
  t.equal(await lifecycle('/no/such/dir-xyz', ['postinstall']), false, 'a missing package.json is a no-op')
  t.end()
})
