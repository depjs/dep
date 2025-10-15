#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const tmpHomeDir = path.join(__dirname, '..', '.tmp-standard-home')
fs.mkdirSync(tmpHomeDir, { recursive: true })
process.env.HOME = tmpHomeDir
process.env.USERPROFILE = tmpHomeDir
const cacheDir = path.join(tmpHomeDir, '.cache', 'standard')
fs.mkdirSync(cacheDir, { recursive: true })
process.env.XDG_CACHE_HOME = path.join(tmpHomeDir, '.cache')
process.env.ESLINT_CACHE = 'false'
process.env.ESLINT_CACHE_LOCATION = path.join(cacheDir, 'eslintcache')
process.env.STANDARD_CACHE = cacheDir
process.env.STANDARD_CACHE_DIR = cacheDir

const standardEngine = require('standard-engine')

const loadOptions = async () => {
  const mod = await import('standard/lib/options.js')
  return mod.default || mod
}

const run = async () => {
  const baseOptions = await loadOptions()
  const options = {
    ...baseOptions,
    cache: false,
    eslintConfig: {
      ...(baseOptions.eslintConfig || {}),
      cacheLocation: cacheDir + path.sep
    }
  }
  standardEngine.cli(options)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
