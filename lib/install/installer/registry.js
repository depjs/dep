import zlib from 'zlib'
import { rm } from 'fs/promises'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import tar from '../../utils/tar-fs.js'
import { fetchStream } from '../../utils/fetch.js'
import { createVerifier } from '../../utils/integrity.js'

export default async (pkg, cwd, signal) => {
  // Stream download → gunzip → extract so network, CPU and disk overlap
  // instead of buffering the whole compressed tarball in memory first. The
  // hash is fed incrementally as bytes arrive and checked when the download
  // completes; on a mismatch the pipeline aborts and everything extracted so
  // far is removed. Nothing ever executes unverified content: lifecycle
  // scripts and native builds only run after the entire tree has installed
  // successfully, which a failed verification prevents.
  const verifier = createVerifier(pkg, pkg.tarball)
  const stream = await fetchStream(pkg.tarball, signal)
  const verify = new Transform({
    transform (chunk, encoding, callback) {
      verifier.update(chunk)
      callback(null, chunk)
    },
    flush (callback) {
      try {
        verifier.verify()
        callback()
      } catch (e) {
        callback(e)
      }
    }
  })
  try {
    // A large output chunk size cuts the number of zlib callback round-trips
    // (and downstream tar-parse buffer merges) by ~64x versus the 16KB
    // default, which is a measurable win on packages shipping big binaries.
    await pipeline(stream, verify, zlib.createGunzip({ chunkSize: 1024 * 1024 }), tar.extract(cwd, { strip: 1 }))
  } catch (e) {
    await rm(cwd, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(() => {})
    throw e
  }
}
