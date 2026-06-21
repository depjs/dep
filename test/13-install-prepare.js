import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

// A lifecycle script that drops a marker file, written via a helper script to
// avoid shell-quoting issues across platforms.
const marker = (name) => `node life.js ${name}`

const mkProject = (extra) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-life-'))
  fs.writeFileSync(path.join(dir, 'life.js'),
    "require('fs').writeFileSync(process.argv[2], 'ok')\n")
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify(Object.assign({ name: 't', version: '1.0.0' }, extra)))
  return dir
}

tap.test('install runs the full root lifecycle in order', (t) => {
  const dir = mkProject({
    dependencies: { 'is-odd': '^3.0.0' },
    scripts: {
      preinstall: marker('1-preinstall'),
      install: marker('2-install'),
      postinstall: marker('3-postinstall'),
      prepare: marker('4-prepare')
    }
  })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error')
    for (const m of ['1-preinstall', '2-install', '3-postinstall', '4-prepare']) {
      t.ok(fs.existsSync(path.join(dir, m)), `${m} script executed`)
    }
    // postinstall/prepare run after deps are installed
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'is-odd')), 'dependencies present for post-deps scripts')
    t.end()
  })
})

tap.test('install does nothing extra when there are no lifecycle scripts', (t) => {
  const dir = mkProject({ dependencies: { 'is-odd': '^3.0.0' } })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'is-odd')), 'dependency installed')
    t.end()
  })
})

tap.test('install runs each workspace lifecycle', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-life-ws-'))
  const write = (rel, obj) => {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, typeof obj === 'string' ? obj : JSON.stringify(obj))
  }
  write('package.json', { name: 'root', version: '1.0.0', private: true, workspaces: ['packages/*'] })
  write('packages/a/life.js', "require('fs').writeFileSync(process.argv[2], 'ok')\n")
  write('packages/a/package.json', { name: '@scope/a', version: '1.0.0', scripts: { postinstall: marker('ran.txt'), prepare: marker('prepared.txt') } })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error')
    t.ok(fs.existsSync(path.join(dir, 'packages', 'a', 'ran.txt')), 'workspace postinstall executed')
    t.ok(fs.existsSync(path.join(dir, 'packages', 'a', 'prepared.txt')), 'workspace prepare executed')
    t.end()
  })
})
