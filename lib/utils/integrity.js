import crypto from 'crypto'

// Verify a downloaded tarball against the registry's expected hash. Prefers the
// Subresource Integrity string (`integrity`, e.g. `sha512-<base64>`), falling
// back to the legacy hex `shasum` (sha1). Throws on mismatch; a no-op when no
// expected hash is available (git/remote tarballs).
export default (buffer, { integrity, shasum } = {}, name) => {
  const label = name ? ` for ${name}` : ''

  if (integrity) {
    // An integrity string may list several alternatives; any match is fine.
    const entries = integrity.trim().split(/\s+/)
    const ok = entries.some((entry) => {
      const dash = entry.indexOf('-')
      if (dash === -1) return false
      const algorithm = entry.slice(0, dash)
      const expected = entry.slice(dash + 1)
      let actual
      try {
        actual = crypto.createHash(algorithm).update(buffer).digest('base64')
      } catch (e) {
        return false
      }
      return actual === expected
    })
    if (!ok) {
      throw new Error(`Integrity check failed${label}: expected ${integrity}`)
    }
    return
  }

  if (shasum) {
    const actual = crypto.createHash('sha1').update(buffer).digest('hex')
    if (actual !== shasum) {
      throw new Error(`Checksum check failed${label}: expected sha1 ${shasum}, got ${actual}`)
    }
  }
}
