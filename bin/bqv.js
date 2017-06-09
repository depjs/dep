#!/usr/bin/env node

if (Number(process.version.substr(1, 1)) < 8) {
  console.error('N-API is available in Node.js 8.0')
  process.exit(1)
}

const yargs = require('yargs')

