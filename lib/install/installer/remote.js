import zlib from 'zlib'
import tar from '../../utils/tar-fs.js'
import { fetchStream } from '../../utils/fetch.js'

export default async (pkg, cwd) => {
  const stream = await fetchStream(pkg.url)
  return new Promise((resolve, reject) => {
    const extract = tar.extract(cwd, { strip: 1 })
    extract.on('finish', resolve)
    extract.on('error', reject)
    stream.on('error', reject)
    stream
      .pipe(zlib.createGunzip()).on('error', reject)
      .pipe(extract)
  })
}
