#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const standardEngine = require('standard-engine')
const baseOptions = require('standard/options')

const cacheDir = path.join(__dirname, '..', '.cache', 'standard')
fs.mkdirSync(cacheDir, { recursive: true })

const options = {
  ...baseOptions,
  eslintConfig: {
    ...baseOptions.eslintConfig,
    cacheLocation: cacheDir + path.sep
  }
}

standardEngine.cli(options)
