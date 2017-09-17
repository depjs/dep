const fs = require('fs')
const path = require('path')
const test = require('tap').test
const isRoot = require('../lib/utils/is-root')

test((t) => {
  if (!isRoot()) return t.end()
  fs.chmodSync(path.join(__dirname, '../.nyc_output'), '0777')
  const files = fs.readdirSync(path.join(__dirname, '../.nyc_output'))
  files.forEach((file) => {
    fs.chmodSync(path.join(__dirname, `../.nyc_output/${file}`), '0777')
  })
  t.end()
})
