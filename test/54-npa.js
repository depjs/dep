import tap from './helpers/tap.js'
import npa from '../lib/utils/npa.js'

// npa's git-url parsing has three shapes: a full `scheme://` url, an scp-style
// `user@host:path`, and anything else (no recognisable host).

tap.test('npa parses an scp-style git url', (t) => {
  const r = npa('x@git@github.com:watilde/happy-birthday.git', process.cwd())
  t.equal(r.type, 'git', 'classified as a git dependency')
  t.equal(r.hosted.domain, 'github.com', 'host parsed from the scp form')
  t.equal(r.hosted.project, 'happy-birthday', 'project parsed')
  t.notOk(r.hosted.auth, 'the default `git` user is not treated as auth')
  t.end()
})

tap.test('npa keeps a non-default user as auth in an scp url', (t) => {
  const r = npa('x@deploy@example.com:team/app.git', process.cwd())
  t.equal(r.hosted.domain, 'example.com', 'host parsed')
  t.equal(r.hosted.auth, 'deploy', 'a non-git user is kept as auth')
  t.end()
})

// `git+ssh://git@host/...` is the form npm writes for a github dependency, and
// `git` there is the ssh transport user, not a credential. Keeping it makes
// filetemplate emit https://git@raw.githubusercontent.com/..., which fetch()
// rejects outright ("URL that includes credentials").
tap.test('npa drops the default `git` user from a scheme:// git url', (t) => {
  const r = npa('x@git+ssh://git@github.com/watilde/happy-birthday.git', process.cwd())
  t.equal(r.type, 'git', 'classified as a git dependency')
  t.equal(r.hosted.domain, 'github.com', 'host parsed from the scheme form')
  t.equal(r.hosted.project, 'happy-birthday', 'project parsed')
  t.notOk(r.hosted.auth, 'the default `git` user is not treated as auth')
  t.end()
})

tap.test('npa keeps a non-default user as auth in a scheme:// git url', (t) => {
  const r = npa('x@git+https://deploy@example.com/team/app.git', process.cwd())
  t.equal(r.hosted.domain, 'example.com', 'host parsed')
  t.equal(r.hosted.auth, 'deploy', 'a non-git user is kept as auth')
  t.end()
})

tap.test('npa accepts a .git spec with no recognisable host', (t) => {
  const r = npa('x@foo.git', process.cwd())
  t.equal(r.type, 'git', 'a bare .git suffix is still a git dependency')
  t.notOk(r.hosted, 'no hosted metadata when neither url form matches')
  t.end()
})
