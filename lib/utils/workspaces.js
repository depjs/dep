import fs from 'fs'
import path from 'path'

// Discover workspace packages declared in a root package.json `workspaces`
// field (npm/yarn style): an array of globs, or { packages: [...] }. Supports
// `*`, `**`, exact paths and `!`-prefixed negations.

const isDir = (p) => {
  try { return fs.statSync(p).isDirectory() } catch (e) { return false }
}

const readPkg = (dir) => {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'))) } catch (e) { return null }
}

const subdirs = (dir) => {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => (e.isDirectory() || e.isSymbolicLink()) && e.name !== 'node_modules' && e.name[0] !== '.')
      .map((e) => e.name)
  } catch (e) {
    return []
  }
}

const allDirs = (dir, acc) => {
  acc.push(dir)
  for (const name of subdirs(dir)) allDirs(path.join(dir, name), acc)
  return acc
}

const segToRe = (seg) =>
  new RegExp('^' + seg.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$')

// Expand a single glob pattern to matching directories under `root`.
const expand = (root, pattern) => {
  let dirs = [root]
  for (const seg of pattern.split('/').filter(Boolean)) {
    const next = []
    for (const d of dirs) {
      if (seg === '**') {
        allDirs(d, next)
      } else if (seg.includes('*')) {
        const re = segToRe(seg)
        for (const name of subdirs(d)) if (re.test(name)) next.push(path.join(d, name))
      } else {
        const p = path.join(d, seg)
        if (isDir(p)) next.push(p)
      }
    }
    dirs = next
  }
  return dirs
}

export const getPatterns = (workspaces) =>
  Array.isArray(workspaces) ? workspaces : (workspaces && workspaces.packages) || []

// Returns [{ dir, name, pkg }] for every workspace package with a name.
export const findWorkspaces = (root, workspaces) => {
  const patterns = getPatterns(workspaces)
  const includes = patterns.filter((p) => !p.startsWith('!'))
  const excludes = patterns.filter((p) => p.startsWith('!')).map((p) => p.slice(1))
  const excluded = new Set()
  for (const pattern of excludes) {
    for (const dir of expand(root, pattern)) excluded.add(dir)
  }

  const seen = new Set()
  const result = []
  for (const pattern of includes) {
    for (const dir of expand(root, pattern)) {
      if (seen.has(dir) || excluded.has(dir) || dir === root) continue
      seen.add(dir)
      const pkg = readPkg(dir)
      if (pkg && pkg.name) result.push({ dir, name: pkg.name, pkg })
    }
  }
  return result
}

// Resolve a `-w` target (a workspace name, or a path relative to root) to one of
// the discovered workspaces. Returns the matching entry, or undefined.
export const resolveWorkspace = (workspaces, root, target) => {
  const byName = workspaces.find((ws) => ws.name === target)
  if (byName) return byName
  const wanted = path.resolve(root, target)
  return workspaces.find((ws) => ws.dir === wanted)
}
