import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'
import run from '../lib/run.js'

// `dep run <script>` reports a failing script and sets a non-zero exit code.
// run() reads process.cwd(), so drive it from a temp project (cwd + exitCode
// are saved and restored).

tap.test('run reports a failing script and sets exitCode', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-run-'))
  const savedCwd = process.cwd()
  const savedExit = process.exitCode
  t.teardown(() => {
    process.chdir(savedCwd)
    process.exitCode = savedExit
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  })
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 't', version: '1.0.0', scripts: { boom: 'exit 7' }
  }))

  process.chdir(dir)
  run.handler({ _: ['run', 'boom'] })

  // run() fires the script asynchronously and swallows the promise; wait for the
  // rejection handler to set process.exitCode.
  for (let i = 0; i < 60 && process.exitCode !== 1; i++) {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  t.equal(process.exitCode, 1, 'a failing script sets exitCode to 1')
  process.exitCode = savedExit
  t.end()
})
