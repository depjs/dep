const path = require('path')
const exec = require('child_process').exec
const test = require('tap').test
const bin = path.join(__dirname, '..', 'bin', 'dep.js')

test((t) => {
  exec(`node ${bin} -h`, (err, stdout, stderr) => {
    t.ifError(err, 'help ran without error')
    t.ok(stdout, 'help displayed a message')
    t.end()
  })
})

test((t) => {
  exec(`node ${bin}`, (err, stdout, stderr) => {
    t.ifError(err, 'help ran without error')
    t.ok(stderr, 'help displayed a message')
    t.end()
  })
})
