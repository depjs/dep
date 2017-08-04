#!/usr/bin/env node

const execFile = require('child_process').execFile
const path = require('path')
const fs = require('fs')
const which = require('which')
const execPath = process.execPath
const binPath = path.dirname(execPath)
const nodeModules = path.join(execPath, '../../lib/node_modules/dep')
const pkgJSON = require('../package.json')
const repository = pkgJSON.repository.url.replace('git+', '')
const bin = path.join(nodeModules, pkgJSON.bin.dep)

which('git', (e, git) => {
  if (e) throw new Error(e)
  process.stdout.write(
    'exec: ' + git + [' clone', repository, nodeModules].join(' ') + '\n'
  )
  execFile(git, ['clone', repository, nodeModules], (e) => {
    if (e) throw new Error(e)
    process.stdout.write('link: ' + bin + '\n')
    process.stdout.write(' => ' + path.join(binPath, 'dep') + '\n')
    fs.link(bin, path.join(binPath, 'dep'), (e) => {
      if (e) throw new Error(e)
      process.stdout.write('dep was installed successfully\n')
    })
  })
})
