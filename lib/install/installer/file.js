import fs from 'fs'
import zlib from 'zlib'
import { PassThrough } from 'stream'
import tar from '../../utils/tar-fs.js'

// Extract a local tarball dependency into node_modules — the same pipeline as
// a remote tarball, reading from disk instead of the network. An uncompressed
// `.tar` skips the gunzip stage.
export default (pkg, cwd) => {
  return new Promise((resolve, reject) => {
    const extract = tar.extract(cwd, { strip: 1 })
    extract.on('finish', resolve)
    extract.on('error', reject)
    const stream = fs.createReadStream(pkg.url)
    stream.on('error', reject)
    stream
      .pipe(/\.tar$/i.test(pkg.url) ? new PassThrough() : zlib.createGunzip({ chunkSize: 1024 * 1024 })).on('error', reject)
      .pipe(extract)
  })
}
