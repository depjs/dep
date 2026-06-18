import fs from 'fs'
import path from 'path'
import tap from 'tap'
import isRoot from '../lib/utils/is-root.js'

tap.test((t) => {
  if (!isRoot()) return t.end()
  fs.chmodSync(path.join(import.meta.dirname, '../.nyc_output'), '0777')
  const files = fs.readdirSync(path.join(import.meta.dirname, '../.nyc_output'))
  files.forEach((file) => {
    fs.chmodSync(path.join(import.meta.dirname, `../.nyc_output/${file}`), '0777')
  })
  t.end()
})
