const path = require('path')
const exec = require('child_process').exec
const test = require('tap').test
const bin = path.join(__dirname, '..', 'bin', 'dep.js')

test((t) => {
  exec(`node ${bin} -v`, (err, stdout, stderr) => {
    t.ifError(err, 'version ran without error')
    t.ok(stdout, 'version displayed a message')
    t.end()
  })
})
