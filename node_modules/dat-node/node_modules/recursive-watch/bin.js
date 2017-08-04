#!/usr/bin/env node

var watch = require('./')

if (!process.argv[2]) {
  console.error('Usage: recursive-watch [path]')
  process.exit(1)
}

watch(process.argv[2], function (filename) {
  console.log(filename, 'has changed')
})
