const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const repository = 'https://github.com/depjs/dep.git'
const binScript = 'bin/dep.js'
const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'npm.cmd' : 'npm'
const binNames = ['dep', 'depjs']

const runCommand = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.stdio || 'pipe'
  })

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

const ensureDir = (dirPath) => fs.mkdirSync(dirPath, { recursive: true })
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
const depBin = path.join(depDir, binScript)

ensureDir(path.dirname(depDir))
ensureDir(binDir)
removeIfExists(depDir)

process.stdout.write(`exec: git clone ${repository} ${depDir}\n`)
runCommand('git', ['clone', repository, depDir], { stdio: 'inherit' })

const createSymlink = (source, dest) => {
  removeIfExists(dest)
  fs.symlinkSync(source, dest)
  fs.chmodSync(dest, 0o755)
}

const createCmdShim = (dest, nodePath, target) => {
  const content = `@ECHO OFF\r\n"${nodePath}" "${target}" %*\r\n`
  fs.writeFileSync(dest, content, 'utf8')
}

const createPowerShellShim = (dest, nodePath, target) => {
  const content = `& "${nodePath}" "${target}" $args\r\n`
  fs.writeFileSync(dest, content, 'utf8')
}

process.stdout.write(`link: ${depBin}\n`)

if (isWindows) {
  binNames.forEach((name) => {
    const cmdPath = path.join(binDir, `${name}.cmd`)
    const psPath = path.join(binDir, `${name}.ps1`)
    const target = depBin

    removeIfExists(cmdPath)
    removeIfExists(psPath)

    createCmdShim(cmdPath, process.execPath, target)
    createPowerShellShim(psPath, process.execPath, target)

    process.stdout.write(` => ${cmdPath}\n`)
    process.stdout.write(` => ${psPath}\n`)
  })
} else {
  binNames.forEach((name) => {
    const linkPath = path.join(binDir, name)
    createSymlink(depBin, linkPath)
    process.stdout.write(` => ${linkPath}\n`)
  })
}
