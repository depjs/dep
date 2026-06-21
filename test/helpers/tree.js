// Minimal stand-in for strong-npm-ls (which wraps read-installed): reports the
// packages physically present under node_modules as `dependencies`, and the
// package's declared devDependencies map as `devDependencies` — the only two
// shapes the test suite reads.
import fs from 'fs'
import path from 'path'

function listInstalled (nodeModules) {
  const out = {}
  let entries
  try { entries = fs.readdirSync(nodeModules, { withFileTypes: true }) } catch (e) { return out }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    if (entry.name.startsWith('@')) {
      let scoped = []
      try { scoped = fs.readdirSync(path.join(nodeModules, entry.name)) } catch (e) {}
      for (const name of scoped) out[`${entry.name}/${name}`] = {}
    } else {
      out[entry.name] = {}
    }
  }
  return out
}

function read (dir, cb) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    cb(null, {
      dependencies: listInstalled(path.join(dir, 'node_modules')),
      devDependencies: pkg.devDependencies || {}
    })
  } catch (err) {
    cb(err)
  }
}

export default { read }
