#!/usr/bin/env node
const crypto = require('crypto')
const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')
const { spawn, spawnSync } = require('child_process')
const { pathToFileURL } = require('url')

const projectRoot = path.join(__dirname, '..')
const homeDir = path.join(projectRoot, '.tmp-home')
const tmpDir = path.join(homeDir, 'tmp')
const runtimeFixturesDir = path.join(homeDir, 'registry-fixtures')
const registryDir = path.join(runtimeFixturesDir, 'registry')
const tarballDir = path.join(runtimeFixturesDir, 'tarballs')

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true })
const removeDir = (dir) => {
  if (typeof fs.rmSync === 'function') {
    fs.rmSync(dir, { recursive: true, force: true })
  } else {
    fsExtra.removeSync(dir)
  }
}

ensureDir(tmpDir)
removeDir(runtimeFixturesDir)
ensureDir(runtimeFixturesDir)
ensureDir(registryDir)
ensureDir(tarballDir)

const registryUrl = pathToFileURL(`${registryDir}${path.sep}`).toString()
const npmCacheDir = path.join(homeDir, '.npm-cache')
ensureDir(npmCacheDir)

const env = {
  ...process.env,
  HOME: homeDir,
  USERPROFILE: homeDir,
  TMPDIR: tmpDir,
  TEMP: tmpDir,
  TMP: tmpDir,
  TAP_NO_ESM: '1',
  DEP_ALLOW_OLD_NODE: '1',
  NPM_CONFIG_REGISTRY: registryUrl,
  npm_config_registry: registryUrl,
  NPM_CONFIG_CACHE: npmCacheDir,
  npm_config_cache: npmCacheDir
}

const npmrcPath = path.join(homeDir, '.npmrc')
fs.writeFileSync(npmrcPath, `registry=${registryUrl}\n`, 'utf8')

const packages = [
  {
    name: 'happy-birthday',
    version: '0.6.0',
    source: path.join(projectRoot, 'test', 'deps', 'file', 'happy-birthday-0.6.0')
  },
  {
    name: 'commander',
    version: '2.9.0',
    source: path.join(projectRoot, 'test', 'fixtures', 'packages', 'commander-2.9.0')
  },
  {
    name: 'minimatch',
    version: '0.0.1',
    source: path.join(projectRoot, 'test', 'fixtures', 'packages', 'minimatch-0.0.1'),
    deprecated: 'minimatch 0.0.1 is deprecated'
  },
  {
    name: 'text-table',
    version: '1.0.0',
    source: path.join(projectRoot, 'test', 'fixtures', 'packages', 'text-table-1.0.0')
  }
]

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const ensureTarball = (pkg) => {
  const filename = `${pkg.name}-${pkg.version}.tgz`
  const tarballPath = path.join(tarballDir, filename)
  if (fs.existsSync(tarballPath)) {
    fs.unlinkSync(tarballPath)
  }
  const result = spawnSync(npmCommand, ['pack', pkg.source, '--pack-destination', tarballDir], {
    cwd: projectRoot,
    stdio: 'inherit',
    env
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
  if (!fs.existsSync(tarballPath)) {
    console.error(`Failed to create tarball for ${pkg.name}`)
    process.exit(1)
  }
  return tarballPath
}

const writeMetadata = (pkg, tarballPath) => {
  const manifestPath = path.join(pkg.source, 'package.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const contents = fs.readFileSync(tarballPath)
  const shasum = crypto.createHash('sha1').update(contents).digest('hex')
  const tarballUrl = pathToFileURL(tarballPath).toString()
  const metadataPath = path.join(registryDir, pkg.name)
  const metadata = {
    name: pkg.name,
    'dist-tags': {
      latest: pkg.version
    },
    versions: {}
  }
  metadata.versions[pkg.version] = {
    name: pkg.name,
    version: pkg.version,
    dependencies: manifest.dependencies || {},
    dist: {
      shasum,
      tarball: tarballUrl
    }
  }
  if (pkg.deprecated) {
    metadata.versions[pkg.version].deprecated = pkg.deprecated
  }
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
}

packages.forEach((pkg) => {
  const tarballPath = ensureTarball(pkg)
  writeMetadata(pkg, tarballPath)
})

const tapBin = require.resolve('tap/bin/run.js')
const args = process.argv.slice(2)

const child = spawn(process.execPath, [tapBin, ...args], {
  stdio: 'inherit',
  env
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})

child.on('error', (error) => {
  console.error(error)
  process.exitCode = 1
})
