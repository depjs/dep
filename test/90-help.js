import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

tap.test((t) => {
  exec(`node ${bin} -h`, (err, stdout, stderr) => {
    t.error(err, 'help ran without error')
    t.ok(stdout, 'help displayed a message')
    t.end()
  })
})

tap.test((t) => {
  exec(`node ${bin}`, (err, stdout, stderr) => {
    t.error(err, 'help ran without error')
    t.ok(stderr, 'help displayed a message')
    t.end()
  })
})
