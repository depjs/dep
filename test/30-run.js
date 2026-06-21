import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const pkg = path.join(import.meta.dirname, 'deps', 'run')
const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

tap.test((t) => {
  exec(`node ${bin} run`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, 'run without error')
    t.end()
  })
})

tap.test((t) => {
  exec(`node ${bin} run test`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, 'run test without error')
    t.end()
  })
})
