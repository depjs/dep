import path from 'path'
import fs from 'fs'
import os from 'os'

const version = JSON.parse(
  fs.readFileSync(new URL('../../package.json', import.meta.url))
).version
const defaultrc = {
  userAgent: `dep/${version} node/${process.version}`,
  registry: 'https://registry.yarnpkg.com/',
  'save-prefix': '^'
}

// Line-based subset of npm's ini format: `key=value` pairs plus `#`/`;`
// comments. Values are split on the first `=` only — auth tokens are base64
// and can contain `=` themselves. Bare keys (no `=`) are flags, stored as true.
const parse = (file) => {
  const rc = {}
  for (const line of file.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed[0] === '#' || trimmed[0] === ';') continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) rc[trimmed] = true
    else rc[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return rc
}

const read = (file) => fs.existsSync(file) ? parse(fs.readFileSync(file, 'utf8')) : {}

// npm's precedence order: a project-local .npmrc (dep runs from the package
// root, so that's cwd) overrides the user's ~/.npmrc. os.homedir() honours
// $HOME on posix but falls back to %USERPROFILE% on Windows, where cmd.exe
// and PowerShell set no $HOME at all.
const npmrc = Object.assign(
  read(path.join(os.homedir(), '.npmrc')),
  read(path.join(process.cwd(), '.npmrc'))
)

// for safer
delete npmrc.AuthSession

export default Object.assign(defaultrc, npmrc)
