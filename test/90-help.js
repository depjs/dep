const path = require('path')
const execFile = require('child_process').execFile
const test = require('tap').test
const bin = path.join(__dirname, '..', 'bin', 'dep.js')

test((t) => {
  execFile(bin, ['-h'], (err, stdout, stderr) => {
    t.ifError(err, 'help ran without error')
    t.ok(stdout, 'help displayed a message')
    t.end()
  })
})

test((t) => {
  execFile(bin, (err, stdout, stderr) => {
    t.ifError(err, 'help ran without error')
    t.ok(stderr, 'help displayed a message')
    t.end()
  })
})
