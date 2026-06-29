import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

// Regression: a dependency's own install/postinstall scripts must run only
// after the whole tree is on disk. Previously they ran inline, right after that
// one package extracted, so a package whose postinstall needs a dependency that
// is still being fetched failed with "Cannot find module" — e.g. electron's
// `node install.js` requiring `ms` before `ms` had been written to disk.
//
// Here `parent` is a local package (copied near-instantly) whose postinstall
// requires its own registry dependency (fetched over the network, so it always
// lands later). Running the script inline loses the race; deferring it until
// the tree is complete makes the dependency reliably present.
tap.test('a dependency postinstall runs after its (slower) dependencies are installed', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-deplife-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  const write = (rel, obj) => {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, typeof obj === 'string' ? obj : JSON.stringify(obj))
  }

  // The postinstall throws (non-zero exit -> install fails) if the registry
  // dependency isn't resolvable yet, and otherwise drops a marker.
  write('parent/check.js',
    "require.resolve('is-odd')\n" +
    "require('fs').writeFileSync(require('path').join(__dirname, 'ran.txt'), 'ok')\n")
  write('parent/package.json', {
    name: 'parent',
    version: '1.0.0',
    dependencies: { 'is-odd': '^3.0.0' },
    scripts: { postinstall: 'node check.js' }
  })

  write('package.json', {
    name: 'root',
    version: '1.0.0',
    private: true,
    dependencies: { parent: path.join(dir, 'parent') }
  })

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error (dependency present at postinstall time)')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'parent', 'ran.txt')), 'parent postinstall executed')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'is-odd')), 'registry dependency installed')
    t.end()
  })
})
