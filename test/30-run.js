const path = require('path')
const exec = require('child_process').exec
const test = require('tap').test
const pkg = path.join(__dirname, 'deps', 'run')
const bin = path.join(__dirname, '..', 'bin', 'dep.js')

test((t) => {
  exec(`node ${bin} run`, { cwd: pkg }, (err, stdout, stderr) => {
    t.ifError(err, 'run without error')
    t.end()
  })
})

test((t) => {
  exec(`node ${bin} run test`, { cwd: pkg }, (err, stdout, stderr) => {
    t.ifError(err, 'run test without error')
    t.end()
  })
})
