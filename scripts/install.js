const exec = require('child_process').exec
const execFile = require('child_process').execFile
const path = require('path')
const fs = require('fs')
const execPath = process.execPath
const binPath = path.dirname(execPath)
const nodeModules = path.join(execPath, '../../lib/node_modules/dep')
const datNode = path.join(nodeModules, 'node_modules/dat-node')
const repository = 'https://github.com/watilde/dep.git'
const bin = path.join(nodeModules, 'bin/dep.js')

process.stdout.write(
  'exec: git' + [' clone', repository, nodeModules].join(' ') + '\n'
)
exec('git clone ' + repository + ' ' + nodeModules, (e) => {
  if (e) throw e
  process.stdout.write('link: ' + bin + '\n')
  process.stdout.write(' => ' + path.join(binPath, 'dep') + '\n')
  fs.link(bin, path.join(binPath, 'dep'), (e) => {
    if (e) throw e
    process.stdout.write('install: dat-node\n')
    execFile(bin, ['install'], {cwd: datNode}, (e) => {
      if (e) throw e
      process.stdout.write('dep was installed successfully\n')
    })
  })
})
