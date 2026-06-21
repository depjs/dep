import path from 'path'
import semver from './semver.js'

// Minimal npm-package-arg replacement. Resolves a `name@spec` argument into the
// shape dep's fetchers consume: { type, name, escapedName, fetchSpec, hosted }.
//
// `hosted` uses the {placeholder} string-template form that lib/.../fetchers/git.js
// expects (domain/user/project/committish/auth + file/https templates).

const splitNameSpec = (arg) => {
  if (arg.startsWith('@')) {
    const slash = arg.indexOf('/')
    const at = arg.indexOf('@', slash === -1 ? 1 : slash)
    return at === -1 ? [arg, ''] : [arg.slice(0, at), arg.slice(at + 1)]
  }
  const at = arg.indexOf('@')
  return at <= 0 ? [arg, ''] : [arg.slice(0, at), arg.slice(at + 1)]
}

const isGit = (spec) =>
  /^git[+:]/.test(spec) ||
  /^(github|gitlab|bitbucket|gist):/.test(spec) ||
  /^[^@/\s]+@[^:/]+:.+/.test(spec) ||
  /\.git(#.*)?$/.test(spec)

const parseGit = (spec) => {
  let s = spec.replace(/^git\+/, '')
  let committish = ''
  const hash = s.indexOf('#')
  if (hash !== -1) {
    committish = s.slice(hash + 1)
    s = s.slice(0, hash)
  }
  let host
  let auth = null
  let m
  if ((m = s.match(/^[a-z+]+:\/\/(?:([^@/]+)@)?([^/]+)\/(.+?)(?:\.git)?\/?$/i))) {
    auth = m[1] || null
    host = m[2]
  } else if ((m = s.match(/^(?:([^@]+)@)?([^:]+):(.+?)(?:\.git)?\/?$/))) {
    auth = m[1] && m[1] !== 'git' ? m[1] : null
    host = m[2]
  } else {
    return { fetchSpec: s, hosted: null }
  }
  const parts = m[3].split('/')
  const project = parts.pop()
  const user = parts.join('/')
  const hosted = {
    domain: host,
    user,
    project,
    committish,
    auth,
    filetemplate: host === 'github.com'
      ? 'https://{auth@}raw.githubusercontent.com/{user}/{project}/{committish}/{path}'
      : 'https://{auth@}{domain}/{user}/{project}/raw/{committish}/{path}',
    httpstemplate: 'git+https://{auth@}{domain}/{user}/{project}.git{#committish}'
  }
  return { fetchSpec: `https://${host}/${user}/${project}.git`, hosted }
}

export default (arg, where) => {
  const [name, spec] = splitNameSpec(arg)
  const escapedName = name ? name.replace('/', '%2f') : name

  if (spec && isGit(spec)) {
    const { fetchSpec, hosted } = parseGit(spec)
    return { type: 'git', name, escapedName, fetchSpec, hosted }
  }

  if (/^https?:\/\//.test(spec)) {
    return { type: 'remote', name, escapedName, fetchSpec: spec, hosted: null }
  }

  // Local paths: ./x, ../x, /x, ~/x, file:x, or a Windows drive path. A bare
  // leading `~` (e.g. `~1.2.3`) is a tilde semver range, not a home path.
  if (/^(\.\.?\/|\.\.?$|\/|~\/|file:)/.test(spec) || /^[a-zA-Z]:[\\/]/.test(spec)) {
    const p = path.resolve(where || process.cwd(), spec.replace(/^file:/, ''))
    const type = /\.(tgz|tar\.gz|tar)$/.test(p) ? 'file' : 'directory'
    return { type, name, escapedName, fetchSpec: p, hosted: null }
  }

  // registry
  let type
  if (spec === '') type = 'range'
  else if (semver.valid(spec)) type = 'version'
  else if (semver.validRange(spec)) type = 'range'
  else type = 'tag'
  return {
    type,
    name,
    escapedName,
    fetchSpec: spec === '' ? '*' : spec,
    hosted: null
  }
}
