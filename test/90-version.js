import path from 'path'
import { exec } from 'child_process'
import tap from 'tap'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

tap.test((t) => {
  exec(`node ${bin} -v`, (err, stdout, stderr) => {
    t.error(err, 'version ran without error')
    t.ok(stdout, 'version displayed a message')
    t.end()
  })
})
