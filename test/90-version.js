const path = require('path')
const execFile = require('child_process').execFile
const test = require('tap').test
const bin = path.join(__dirname, '..', 'bin', 'dep.js')

test((t) => {
  execFile(bin, ['-v'], (err, stdout, stderr) => {
    t.ifError(err, 'version ran without error')
    t.ok(stdout, 'version displayed a message')
    t.end()
  })
})
