import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'

// npmrc/auth resolve ~/.npmrc and the project-local .npmrc once at import
// time, so build both scratch configs first, point HOME and cwd at them, and
// dynamic-import afterwards (the same pattern as 58-bin.js). One config holds
// every case; each test just queries the matcher.
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-auth-home-'))
const project = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-auth-proj-'))

fs.writeFileSync(path.join(home, '.npmrc'), [
  'save-prefix=~',
  '# comments and blank lines are skipped',
  '',
  '//user.example.com/:_authToken=from-user',
  '//token.example.com/:_authToken=abc==',
  '//basic.example.com/:_auth=YWxhZGRpbjpzZXNhbWU=',
  '//both.example.com/:_auth=basic-loses',
  '//both.example.com/:_authToken=token-wins',
  '//env.example.com/:_authToken=${DEP_TEST_TOKEN}',
  '//unset.example.com/:_authToken=${DEP_TEST_UNSET}',
  '//unset2.example.com/:_auth=${DEP_TEST_UNSET}',
  '//path.example.com/npm/:_authToken=scoped-to-path',
  '//port.example.com:4873/:_authToken=with-port'
].join('\n'))
fs.writeFileSync(path.join(project, '.npmrc'),
  '//user.example.com/:_authToken=from-project\n')

process.env.DEP_TEST_TOKEN = 'expanded'
delete process.env.DEP_TEST_UNSET
const HOME = process.env.HOME
const cwd = process.cwd()
process.env.HOME = home
process.chdir(project)

// The unset-variable warning is written to stderr while auth.js loads.
let warnings = ''
const write = process.stderr.write.bind(process.stderr)
process.stderr.write = (s) => { warnings += s; return true }
const { default: authHeaderFor } = await import('../lib/utils/auth.js')
const { default: npmrc } = await import('../lib/utils/npmrc.js')
process.stderr.write = write

process.env.HOME = HOME
process.chdir(cwd)

const teardown = (t) => t.teardown(() => {
  fs.rmSync(home, { recursive: true, force: true })
  fs.rmSync(project, { recursive: true, force: true })
})

tap.test('npmrc parses values containing = and skips comments', (t) => {
  t.equal(npmrc['save-prefix'], '~', 'plain keys still read')
  t.equal(npmrc['//token.example.com/:_authToken'], 'abc==',
    'a base64 token keeps its trailing =')
  t.notOk('# comments and blank lines are skipped' in npmrc, 'comments are not keys')
  t.end()
})

tap.test('a project-local .npmrc overrides ~/.npmrc', (t) => {
  t.equal(authHeaderFor('https://user.example.com/pkg'), 'Bearer from-project',
    'the project token wins over the user one')
  t.end()
})

tap.test('_authToken becomes Bearer, _auth becomes Basic, token wins over both', (t) => {
  t.equal(authHeaderFor('https://token.example.com/pkg'), 'Bearer abc==')
  t.equal(authHeaderFor('https://basic.example.com/pkg'), 'Basic YWxhZGRpbjpzZXNhbWU=')
  t.equal(authHeaderFor('https://both.example.com/pkg'), 'Bearer token-wins',
    '_authToken wins when both are configured')
  t.end()
})

tap.test('${VAR} values expand from the environment', (t) => {
  t.equal(authHeaderFor('https://env.example.com/pkg'), 'Bearer expanded')
  t.end()
})

tap.test('an unset ${VAR} drops the credential and warns once', (t) => {
  t.equal(authHeaderFor('https://unset.example.com/pkg'), undefined,
    'no header for a credential whose variable is unset')
  t.equal(authHeaderFor('https://unset2.example.com/pkg'), undefined,
    'the _auth form is dropped the same way')
  t.match(warnings, /DEP_TEST_UNSET/, 'warns about the missing variable')
  t.equal(warnings.match(/DEP_TEST_UNSET/g).length, 1,
    'warns once even when two credentials reference the variable')
  t.end()
})

tap.test('tokens never leave their configured host or path prefix', (t) => {
  t.equal(authHeaderFor('https://other.example.com/token.example.com/pkg'), undefined,
    'a different host gets no header, even with a look-alike path')
  t.equal(authHeaderFor('https://path.example.com/npm/lodash/-/lodash-1.0.0.tgz'),
    'Bearer scoped-to-path', 'a path-scoped key covers URLs under its prefix')
  t.equal(authHeaderFor('https://path.example.com/other/pkg'), undefined,
    'a path-scoped key does not cover sibling paths')
  t.equal(authHeaderFor('http://port.example.com:4873/pkg'), 'Bearer with-port',
    'a key with a port matches that host:port')
  t.equal(authHeaderFor('http://port.example.com/pkg'), undefined,
    'the same host without the port does not match')
  t.equal(authHeaderFor('not a url'), undefined, 'an unparsable URL gets no header')
  teardown(t)
  t.end()
})
