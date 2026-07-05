import npmrc from './npmrc.js'

// Registry credentials from .npmrc, in npm's registry-scoped ("nerf dart")
// format — the registry URL with its protocol stripped, down to a path prefix:
//
//   //host[:port][/path]/:_authToken=<token>   -> Authorization: Bearer <token>
//   //host[:port][/path]/:_auth=<base64>       -> Authorization: Basic <base64>
//
// _authToken wins when both are set for the same registry key. Values may
// reference environment variables with npm's ${VAR} syntax.

const warned = new Set()

// npm fails the whole command when a ${VAR} in a config value is unset; dep
// instead treats that credential as absent and warns once per variable. The
// command proceeds unauthenticated — against a registry that needed the token
// the 401 hint points back at .npmrc, and against one that didn't (a laptop
// on the public registry with a CI-only token in a shared ~/.npmrc) it just
// works instead of failing before the first request.
const expand = (value) => {
  let missing = false
  const expanded = value.replace(/\$\{([^}]+)\}/g, (_, name) => {
    if (process.env[name] !== undefined) return process.env[name]
    missing = true
    if (!warned.has(name)) {
      warned.add(name)
      process.stderr.write(
        `dep warn: \${${name}} in .npmrc is not set; ` +
        'ignoring the credential that references it\n')
    }
    return ''
  })
  return missing ? undefined : expanded
}

// '//host[/path]/:_authToken' keys, mapped as 'host[/path]/' -> header value.
const credentials = {}
for (const key of Object.keys(npmrc)) {
  if (!key.startsWith('//')) continue
  const isToken = key.endsWith('/:_authToken')
  const isBasic = key.endsWith('/:_auth')
  if ((!isToken && !isBasic) || typeof npmrc[key] !== 'string') continue
  const registry = key.slice(2, key.lastIndexOf('/:') + 1)
  const value = expand(npmrc[key])
  if (value === undefined || value === '') continue
  if (isToken) credentials[registry] = `Bearer ${value}`
  else if (!credentials[registry]) credentials[registry] = `Basic ${value}`
}

// The Authorization header value for a URL, or undefined. Matched the way npm
// does: strip the protocol, then walk the URL's path from most to least
// specific, so a key for `//host/npm/` covers everything under that prefix.
// The host (with port) must match exactly — a token is never sent to another
// host, no matter where a lockfile's `resolved` URLs point.
export default (url) => {
  let u
  try { u = new URL(url) } catch (e) { return undefined }
  let pathname = u.pathname
  while (true) {
    const dir = pathname.slice(0, pathname.lastIndexOf('/') + 1)
    const header = credentials[u.host + dir]
    if (header) return header
    if (dir === '/') return undefined
    pathname = dir.slice(0, -1)
  }
}
