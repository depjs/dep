import crypto from 'crypto'

// Streaming verifier for a downloaded tarball against the registry's expected
// hash. Prefers the Subresource Integrity string (`integrity`, e.g.
// `sha512-<base64>`), falling back to the legacy hex `shasum` (sha1). Feed the
// compressed bytes to `update()` as they arrive; `verify()` throws on mismatch
// and is a no-op when no expected hash is available (git/remote tarballs).
export const createVerifier = ({ integrity, shasum } = {}, name) => {
  const label = name ? ` for ${name}` : ''
  const hashes = new Map() // algorithm -> incremental hash (null if unsupported)
  const entries = [] // { algorithm, expected } for each well-formed alternative

  const hashFor = (algorithm) => {
    if (!hashes.has(algorithm)) {
      let hash = null
      try {
        hash = crypto.createHash(algorithm)
      } catch (e) {}
      hashes.set(algorithm, hash)
    }
    return hashes.get(algorithm)
  }

  if (integrity) {
    // An integrity string may list several alternatives; any match is fine.
    // Malformed entries and unknown algorithms can never match, so they are
    // simply not tracked.
    for (const entry of integrity.trim().split(/\s+/)) {
      const dash = entry.indexOf('-')
      if (dash === -1) continue
      const algorithm = entry.slice(0, dash)
      if (!hashFor(algorithm)) continue
      entries.push({ algorithm, expected: entry.slice(dash + 1) })
    }
  } else if (shasum) {
    hashFor('sha1')
  }

  return {
    update (chunk) {
      for (const hash of hashes.values()) {
        if (hash) hash.update(chunk)
      }
    },
    verify () {
      if (integrity) {
        const digests = new Map()
        for (const [algorithm, hash] of hashes) {
          if (hash) digests.set(algorithm, hash.digest('base64'))
        }
        const ok = entries.some((e) => digests.get(e.algorithm) === e.expected)
        if (!ok) {
          throw new Error(`Integrity check failed${label}: expected ${integrity}`)
        }
        return
      }
      if (shasum) {
        const actual = hashes.get('sha1').digest('hex')
        if (actual !== shasum) {
          throw new Error(`Checksum check failed${label}: expected sha1 ${shasum}, got ${actual}`)
        }
      }
    }
  }
}

// Buffer variant: verify an already-downloaded tarball in one shot.
export default (buffer, pkg = {}, name) => {
  const verifier = createVerifier(pkg, name)
  verifier.update(buffer)
  verifier.verify()
}
