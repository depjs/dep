import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from 'tap'
import { findWorkspaces, resolveWorkspace } from '../lib/utils/workspaces.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

const mkMonorepo = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-ws-'))
  const write = (rel, obj) => {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(obj, null, 2))
  }
  write('package.json', { name: 'root', version: '1.0.0', private: true, workspaces: ['packages/*'] })
  write('packages/a/package.json', { name: '@scope/a', version: '1.0.0', dependencies: { 'is-odd': '^3.0.0' } })
  write('packages/b/package.json', { name: 'pkg-b', version: '1.0.0', dependencies: { '@scope/a': '^1.0.0', 'is-number': '^7.0.0' } })
  return root
}

tap.test('findWorkspaces discovers packages by glob, honouring excludes', (t) => {
  const root = mkMonorepo()
  fs.mkdirSync(path.join(root, 'packages', 'ignored'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'packages', 'ignored', 'package.json'),
    JSON.stringify({ name: 'ignored', version: '1.0.0' })
  )
  t.teardown(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  const all = findWorkspaces(root, ['packages/*'])
  t.same(all.map((w) => w.name).sort(), ['@scope/a', 'ignored', 'pkg-b'], 'globs every package dir')

  const filtered = findWorkspaces(root, ['packages/*', '!packages/ignored'])
  t.same(filtered.map((w) => w.name).sort(), ['@scope/a', 'pkg-b'], 'negation excludes a package')
  t.end()
})

tap.test('install links workspaces, hoists shared deps and nests conflicts', (t) => {
  const root = mkMonorepo()
  t.teardown(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: root }, (err) => {
    t.error(err, 'workspace install ran without error')

    const nm = path.join(root, 'node_modules')
    t.ok(fs.lstatSync(path.join(nm, 'pkg-b')).isSymbolicLink(), 'pkg-b is symlinked into node_modules')
    t.ok(fs.lstatSync(path.join(nm, '@scope', 'a')).isSymbolicLink(), 'scoped workspace is symlinked')

    // cross-workspace dependency resolves through the link
    t.ok(fs.existsSync(path.join(nm, '@scope', 'a', 'package.json')), 'pkg-b can reach @scope/a')

    // shared registry dep hoisted; conflicting transitive version nested
    const top = JSON.parse(fs.readFileSync(path.join(nm, 'is-number', 'package.json')))
    t.match(top.version, /^7\./, 'is-number@7 (direct) hoisted to the top')
    const nested = JSON.parse(fs.readFileSync(path.join(nm, 'is-odd', 'node_modules', 'is-number', 'package.json')))
    t.match(nested.version, /^6\./, "is-odd's is-number@6 nested underneath")

    // workspace packages are linked, never fetched into a real folder
    t.notOk(fs.existsSync(path.join(nm, 'pkg-b', 'node_modules')), 'workspace was not re-installed from the registry')
    t.end()
  })
})

tap.test('lock records workspaces as npm-style link + source entries', (t) => {
  const root = mkMonorepo()
  t.teardown(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: root }, (err) => {
    t.error(err, 'workspace lock ran without error')
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
    const pkgs = lock.packages

    t.same(pkgs[''].workspaces, ['packages/*'], 'root keeps the workspaces field')

    // each workspace: a source entry + a link entry in node_modules
    t.equal(pkgs['packages/a'].name, '@scope/a', 'workspace source entry at its real path')
    t.same(pkgs['node_modules/@scope/a'], { resolved: 'packages/a', link: true }, 'scoped workspace linked to its source')
    t.same(pkgs['node_modules/pkg-b'], { resolved: 'packages/b', link: true }, 'workspace linked to its source')

    // shared dep hoisted, conflict nested — reached through the workspace links
    t.match(pkgs['node_modules/is-number'].version, /^7\./, 'is-number@7 hoisted')
    t.match(pkgs['node_modules/is-odd/node_modules/is-number'].version, /^6\./, 'is-number@6 nested')

    // deps reached only via a workspace are production, not dev/optional
    t.notOk(pkgs['node_modules/is-odd'].dev, 'transitive dep of a workspace is not marked dev')
    t.end()
  })
})

tap.test('lock -w <workspace> narrows the lockfile to that workspace', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-ws-'))
  const write = (rel, obj) => {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(obj, null, 2))
  }
  write('package.json', { name: 'root', version: '1.0.0', private: true, workspaces: ['packages/*'], dependencies: { 'left-pad': '^1.3.0' } })
  write('packages/a/package.json', { name: '@scope/a', version: '1.0.0', dependencies: { 'is-odd': '^3.0.0' } })
  write('packages/b/package.json', { name: 'pkg-b', version: '1.0.0', dependencies: { 'is-number': '^7.0.0' } })
  t.teardown(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock -w @scope/a`, { cwd: root }, (err) => {
    t.error(err, 'scoped lock ran without error')
    const pkgs = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')).packages

    t.ok(pkgs['node_modules/@scope/a'], 'targeted workspace is linked')
    t.ok(pkgs['node_modules/is-odd'], "targeted workspace's dep is locked")
    t.notOk(pkgs['node_modules/pkg-b'], 'other workspace is excluded')
    t.notOk(pkgs['node_modules/left-pad'], 'root-only dep is excluded')
    t.notOk(pkgs[''].dependencies, 'root entry declares no unresolved deps when scoped')

    exec(`node ${bin} lock -w nope`, { cwd: root }, (err2) => {
      t.ok(err2, 'unknown workspace exits non-zero')
      t.end()
    })
  })
})

tap.test('resolveWorkspace matches by name and by path', (t) => {
  const root = mkMonorepo()
  t.teardown(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  const workspaces = findWorkspaces(root, ['packages/*'])

  t.equal(resolveWorkspace(workspaces, root, '@scope/a').dir, path.join(root, 'packages', 'a'), 'resolves by package name')
  t.equal(resolveWorkspace(workspaces, root, 'packages/b').name, 'pkg-b', 'resolves by relative path')
  t.equal(resolveWorkspace(workspaces, root, 'nope'), undefined, 'unknown target is undefined')
  t.end()
})

tap.test('install <pkg> -w <workspace> adds dep to that workspace and hoists it', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-ws-'))
  const write = (rel, obj) => {
    const file = path.join(root, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(obj, null, 2))
  }
  write('package.json', { name: 'root', version: '1.0.0', private: true, workspaces: ['packages/*'] })
  write('packages/a/package.json', { name: '@scope/a', version: '1.0.0' })
  write('packages/b/package.json', { name: 'pkg-b', version: '1.0.0' })
  t.teardown(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  // Bare names (no version) keep `^` out of the shell command — cmd.exe on
  // Windows treats `^` as an escape character. saver then writes the resolved
  // `^<version>`, exercising the save-prefix path too.

  // by name, default save target is dependencies
  exec(`node ${bin} install is-odd -w @scope/a`, { cwd: root }, (err) => {
    t.error(err, 'install -w (by name) ran without error')
    const a = JSON.parse(fs.readFileSync(path.join(root, 'packages', 'a', 'package.json')))
    t.match(a.dependencies && a.dependencies['is-odd'], /^\^3\./, 'dep written to the target workspace')
    t.ok(fs.existsSync(path.join(root, 'node_modules', 'is-odd', 'package.json')), 'dep hoisted into root node_modules')
    t.notOk(fs.existsSync(path.join(root, 'packages', 'b', 'package.json')) &&
      JSON.parse(fs.readFileSync(path.join(root, 'packages', 'b', 'package.json'))).dependencies,
    'other workspace untouched')

    // by path + --save-dev
    exec(`node ${bin} install is-number -w packages/b --save-dev`, { cwd: root }, (err2) => {
      t.error(err2, 'install -w (by path) ran without error')
      const b = JSON.parse(fs.readFileSync(path.join(root, 'packages', 'b', 'package.json')))
      t.match(b.devDependencies && b.devDependencies['is-number'], /^\^7\./, '--save-dev writes to the workspace devDependencies')

      // unknown workspace fails
      exec(`node ${bin} install left-pad -w nope`, { cwd: root }, (err3) => {
        t.ok(err3, 'unknown workspace exits non-zero')
        t.end()
      })
    })
  })
})
