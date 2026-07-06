import fs from 'fs'
import path from 'path'
import TarParser from './tar-parse.js'

// Minimal tar-fs replacement: extract(cwd, { strip }) returns a Writable that
// writes each entry to disk under cwd (dropping `strip` leading path segments)
// and emits `finish` when done.
export const extract = (cwd, opts = {}) => {
  const strip = opts.strip || 0
  // Entries in one tarball overwhelmingly share directories; skipping the
  // repeated mkdirSync calls is a measurable win on large packages.
  const made = new Set()
  const mkdir = (dir) => {
    if (made.has(dir)) return
    fs.mkdirSync(dir, { recursive: true })
    made.add(dir)
  }

  const parser = new TarParser((header, content, done) => {
    try {
      let name = header.name.replace(/\/+$/, '')
      if (strip) name = name.split('/').slice(strip).join('/')
      if (!name) return done()

      const dest = path.join(cwd, name)

      if (header.type === '5') {
        mkdir(dest)
        return done()
      }

      mkdir(path.dirname(dest))

      if (header.type === '2') {
        try { fs.unlinkSync(dest) } catch (e) {}
        fs.symlinkSync(header.linkname, dest)
        return done()
      }

      // Regular file (type '0', '\0', or unset).
      fs.writeFileSync(dest, content, { mode: header.mode || 0o644 })
      done()
    } catch (e) {
      parser.destroy(e)
    }
  })

  return parser
}

export default { extract }
