import zlib from 'zlib'
import { Readable } from 'stream'
import tar from '../../utils/tar-fs.js'
import { fetchStream } from '../../utils/fetch.js'
import { createVerifier } from '../../utils/integrity.js'

export default async (pkg, cwd) => {
  // Hash the tarball incrementally while it downloads (rather than a second
  // pass over the whole buffer afterwards), and verify the result before any
  // of its files are written to disk.
  const verifier = createVerifier(pkg, pkg.tarball)
  const stream = await fetchStream(pkg.tarball)
  const chunks = []
  for await (const chunk of stream) {
    verifier.update(chunk)
    chunks.push(chunk)
  }
  verifier.verify()
  const buffer = Buffer.concat(chunks)
  return new Promise((resolve, reject) => {
    const extract = tar.extract(cwd, { strip: 1 })
    extract.on('finish', resolve)
    extract.on('error', reject)
    Readable.from(buffer)
      .pipe(zlib.createGunzip()).on('error', reject)
      .pipe(extract)
  })
}
