import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'
import { getPatterns, findWorkspaces, resolveWorkspace } from '../lib/utils/workspaces.js'

// Unit coverage for the workspace glob expansion: the `**` deep walk, the
// `{ packages: [...] }` form, and resolveWorkspace's name/path lookups.

const tree = (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-ws-'))
  t.teardown(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  const mk = (rel, name) => {
    const dir = path.join(root, rel)
    fs.mkdirSync(dir, { recursive: true })
    if (name) fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name }))
  }
  mk('packages/a', '@scope/a')
  mk('packages/group/b', 'pkg-b')
  mk('packages/no-name')
  return root
}

tap.test('getPatterns accepts both the array and { packages } forms', (t) => {
  t.same(getPatterns(['a', 'b']), ['a', 'b'], 'an array is returned as is')
  t.same(getPatterns({ packages: ['x'] }), ['x'], 'the packages field is unwrapped')
  t.same(getPatterns(undefined), [], 'missing workspaces yields no patterns')
  t.end()
})

tap.test('findWorkspaces walks ** and skips dirs without a name', (t) => {
  const root = tree(t)
  const found = findWorkspaces(root, ['**']).map((w) => w.name).sort()
  t.same(found, ['@scope/a', 'pkg-b'], '** finds named packages at any depth, no-name dirs excluded')
  t.end()
})

tap.test('findWorkspaces tolerates an unreadable root directory', (t) => {
  t.same(findWorkspaces('/no/such/root-xyz', ['**']), [], 'a missing root yields no workspaces')
  t.end()
})

tap.test('resolveWorkspace matches by name and by path', (t) => {
  const root = tree(t)
  const all = findWorkspaces(root, ['**'])
  t.equal(resolveWorkspace(all, root, '@scope/a').name, '@scope/a', 'resolves by package name')
  t.equal(resolveWorkspace(all, root, 'packages/group/b').name, 'pkg-b', 'resolves by relative path')
  t.equal(resolveWorkspace(all, root, 'nope'), undefined, 'an unknown target is undefined')
  t.end()
})
