import zlib from 'zlib'
import { Readable } from 'stream'
import tar from '../../utils/tar-fs.js'
import { fetchBuffer } from '../../utils/fetch.js'
import verifyIntegrity from '../../utils/integrity.js'

export default async (pkg, cwd) => {
  // Download the whole tarball so its integrity can be verified before any of
  // its files are written to disk.
  const buffer = await fetchBuffer(pkg.tarball)
  verifyIntegrity(buffer, pkg, pkg.tarball)
  return new Promise((resolve, reject) => {
    const extract = tar.extract(cwd, { strip: 1 })
    extract.on('finish', resolve)
    extract.on('error', reject)
    Readable.from(buffer)
      .pipe(zlib.createGunzip()).on('error', reject)
      .pipe(extract)
  })
}
