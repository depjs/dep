#!/usr/bin/env node
const program = require('commander')
const hb = require('./')
const pkg = require('./package.json')
let message = ''
let you = ''

program
  .version(pkg.version)
  .usage('-u name')
  .option('-u, --you [name]', 'Name')
  .parse(process.argv)

if (!program.you) {
  program.help()
} else {
  you = program.you
  message = hb(you)

  console.log('\n🎂')
  console.log(message)
  console.log('🎉')
}
