const path = require('path')
const execFile = require('child_process').execFile
const test = require('tap').test
const pkg = path.join(__dirname, 'deps', 'run')
const bin = path.join(__dirname, '..', 'bin', 'dep.js')

test((t) => {
  execFile(bin, ['run'], {cwd: pkg}, (err, stdout, stderr) => {
    t.ifError(err, 'run without error')
    t.end()
  })
})

test((t) => {
  execFile(bin, ['run', 'test'], {cwd: pkg}, (err, stdout, stderr) => {
    t.ifError(err, 'run test without error')
    t.end()
  })
})
