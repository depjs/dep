const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'npm.cmd' : 'npm'
const binNames = ['dep', 'depjs']

const runCommand = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe' })

  if (result.error) throw result.error
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString() : ''
    const stdout = result.stdout ? result.stdout.toString() : ''
    throw new Error(
      `${command} ${args.join(' ')} exited with code ${result.status}\n${stdout}${stderr}`
    )
  }

  return result.stdout ? result.stdout.toString() : ''
}

const readNpmPath = (...args) => runCommand(npmCommand, args).trim()

const removeIfExists = (targetPath) => {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true })
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

const npmRoot = readNpmPath('root', '-g')
const binDir = readNpmPath('bin', '-g')
const depDir = path.join(npmRoot, 'dep')

process.stdout.write(`remove: ${depDir}\n`)
removeIfExists(depDir)

binNames.forEach((name) => {
  if (isWindows) {
    const cmdPath = path.join(binDir, `${name}.cmd`)
    const psPath = path.join(binDir, `${name}.ps1`)
    process.stdout.write(`remove: ${cmdPath}\n`)
    removeIfExists(cmdPath)
    process.stdout.write(`remove: ${psPath}\n`)
    removeIfExists(psPath)
  } else {
    const linkPath = path.join(binDir, name)
    process.stdout.write(`remove: ${linkPath}\n`)
    removeIfExists(linkPath)
  }
})

process.stdout.write('dep was uninstalled successfully\n')
