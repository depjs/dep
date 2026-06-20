import { Readable } from 'stream'
import TarParser from './tar-parse.js'

// Minimal tar-stream replacement: extract() returns a Writable that emits
// `entry` (header, stream, next) for each archive entry and `finish` at the end.
export const extract = () => {
  const parser = new TarParser((header, content, done) => {
    const stream = Readable.from(content.length ? [content] : [])
    parser.emit('entry', header, stream, done)
  })
  return parser
}

export default { extract }
