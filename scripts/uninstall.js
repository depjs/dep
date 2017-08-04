#!/usr/bin/env node

const path = require('path')
const rimraf = require('rimraf')
const execPath = process.execPath
const binPath = path.dirname(execPath)
const pkg = path.join(execPath, '../../lib/node_modules/dep')
const bin = path.join(binPath, 'dep')

process.stdout.write(
  'remove: ' + pkg + '\n'
)
rimraf(pkg, (e) => {
  process.stdout.write(
    'remove: ' + bin + '\n'
  )
  rimraf(bin, (e) => {
    process.stdout.write('dep was uninstalled successfully\n')
  })
})
