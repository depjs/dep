const path = require('path')
const exec = require('child_process').exec
const test = require('tap').test

test((t) => {
  const bin = path.join(__dirname, '..', 'bin', 'dep.js')
  exec(`node ${bin} -h`, (err, stdout, stderr) => {
    t.ifError(err, 'help ran without error')
    t.ok(stdout, 'help displayed a message')
    t.end()
  })
})

test((t) => {
  const bin = path.join(__dirname, '..', 'bin', 'dep.js')
  exec(`node ${bin}`, (err, stdout, stderr) => {
    t.ifError(err, 'help ran without error')
    t.ok(stdout, 'help displayed a message')
    t.end()
  })
})
