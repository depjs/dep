import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'
import saver from '../lib/install/saver.js'

// saver writes resolved deps back into package.json. When the user gave no
// explicit spec, it derives one from the resolved node: `^version` for registry
// packages, or the node's url for git/remote/local.

const project = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-save-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'r', version: '1.0.0' }))
  return dir
}
const read = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))

tap.test('saver derives ^version for a registry dependency', (t) => {
  const dir = project(t)
  global.dependenciesTree = { 'is-odd': { type: 'registry', version: '3.0.1' } }
  saver(['is-odd'], false, dir)
  t.equal(read(dir).dependencies['is-odd'], '^3.0.1', 'save-prefix + resolved version')
  t.end()
})

tap.test('saver derives the url for a non-registry dependency', (t) => {
  const dir = project(t)
  const url = 'git+https://github.com/watilde/happy-birthday.git#abc123'
  global.dependenciesTree = { 'happy-birthday': { type: 'git', url } }
  saver(['happy-birthday'], false, dir)
  t.equal(read(dir).dependencies['happy-birthday'], url, 'the resolved url is saved')
  t.end()
})

tap.test('saver keeps an explicit spec and writes to devDependencies', (t) => {
  const dir = project(t)
  global.dependenciesTree = { 'is-odd': { type: 'registry', version: '3.0.1' } }
  saver(['is-odd@~3.0.0'], 'dev', dir)
  const json = read(dir)
  t.notOk(json.dependencies, 'nothing written to dependencies')
  t.equal(json.devDependencies['is-odd'], '~3.0.0', 'explicit spec preserved under devDependencies')
  t.end()
})
