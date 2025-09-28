#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const standardEngine = require('standard-engine')

const cacheDir = path.join(__dirname, '..', '.cache', 'standard')
fs.mkdirSync(cacheDir, { recursive: true })

const loadOptions = async () => {
  const mod = await import('standard/lib/options.js')
  return mod.default || mod
}

const run = async () => {
  const baseOptions = await loadOptions()
  const options = {
    ...baseOptions,
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
