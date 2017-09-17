const fs = require('fs')
const path = require('path')
const test = require('tap').test

test((t) => {
  fs.chmodSync(path.join(__dirname, '../.nyc_output'), '7777')
  const files = fs.readdirSync(path.join(__dirname, '../.nyc_output'))
  files.forEach((file) => {
    fs.chmodSync(path.join(__dirname, `../.nyc_output/${file}`), '7777')
  })
  require('child_process').exec('ls -la .nyc_output', (e, out) => {
    console.log('ls -la')
    console.log(out)
    t.end()
  })
})
