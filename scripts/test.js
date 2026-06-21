// Cross-platform test entry: discovers the top-level test/*.js files and runs
// them serially with Node's built-in test runner. Avoids relying on shell glob
// expansion (breaks on Windows) or the runner's glob support (Node 21+ only).
//
// Pass --coverage to print a built-in coverage report (used by `test-ci`), or
// --lcov to additionally write an lcov.info file for upload (used by `coverage`).
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'

const lcov = process.argv.includes('--lcov')
const coverage = lcov || process.argv.includes('--coverage')

const testDir = path.join(import.meta.dirname, '..', 'test')
const files = fs.readdirSync(testDir)
  .filter((name) => name.endsWith('.js') && !name.startsWith('.'))
  .sort()
  .map((name) => path.join('test', name))

const flags = ['--test', '--test-concurrency=1']
if (coverage) {
  flags.push('--experimental-test-coverage')
  // --test-coverage-exclude landed in Node 22.5; skip it on older runtimes
  // (the report still works, it just also lists the test files).
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major > 22 || (major === 22 && minor >= 5)) {
    flags.push('--test-coverage-exclude=test/**', '--test-coverage-exclude=scripts/**')
  }
}
if (lcov) {
  // Keep the human-readable report on stdout and write lcov.info alongside it.
  flags.push(
    '--test-reporter=spec', '--test-reporter-destination=stdout',
    '--test-reporter=lcov', '--test-reporter-destination=lcov.info'
  )
}

const result = spawnSync(process.execPath, [...flags, ...files], { stdio: 'inherit' })

process.exit(result.status === null ? 1 : result.status)
