#!/usr/bin/env node
const crypto = require('crypto')
const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')
const glob = require('glob')
const { spawnSync } = require('child_process')
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

Object.assign(process.env, env)

const { patterns, options } = parseCliArgs(process.argv.slice(2))

if (options.reporter) {
  process.env.TAP_REPORTER = options.reporter
}

if (options.coverage) {
  process.env.TAP_COVERAGE = '1'
}

const tap = require('tap')

if (options.timeout != null) {
  const timeout = Math.max(options.timeout, 5000)
  tap.setTimeout(timeout)
}

if (options.jobs != null) {
  tap.jobs = options.jobs
}

const testFiles = resolveTestFiles(patterns, projectRoot)

if (testFiles.length === 0) {
  console.error('No test files matched the provided pattern(s).')
  process.exit(1)
}

tap.on('complete', (results) => {
  if (!results.ok) {
    process.exitCode = 1
  }
})

for (const file of testFiles) {
  require(file)
}

function parseCliArgs (argv) {
  const patterns = []
  const options = {
    coverage: false,
    jobs: null,
    reporter: null,
    timeout: null
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--timeout') {
      options.timeout = readNumericArg(argv[++i], '--timeout')
    } else if (arg?.startsWith('--timeout=')) {
      options.timeout = readNumericArg(arg.split('=')[1], '--timeout')
    } else if (arg === '--jobs') {
      options.jobs = readNumericArg(argv[++i], '--jobs')
    } else if (arg?.startsWith('--jobs=')) {
      options.jobs = readNumericArg(arg.split('=')[1], '--jobs')
    } else if (arg === '--reporter') {
      options.reporter = argv[++i]
    } else if (arg?.startsWith('--reporter=')) {
      options.reporter = arg.split('=')[1]
    } else if (arg === '--coverage') {
      options.coverage = true
    } else if (arg === '--no-coverage') {
      options.coverage = false
    } else if (arg === '--') {
      patterns.push(...argv.slice(i + 1))
      break
    } else if (arg?.startsWith('-')) {
      // Ignore unknown flags to stay compatible with tap CLI invocations
    } else if (arg) {
      patterns.push(arg)
    }
  }

  return { patterns, options }
}

function readNumericArg (value, flag) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    console.error(`Invalid value provided for ${flag}: ${value}`)
    process.exit(1)
  }
  return parsed
}

function resolveTestFiles (patterns, root) {
  const globPatterns = patterns.length > 0 ? patterns : ['test/**/*.js']
  const files = new Set()

  globPatterns.forEach((pattern) => {
    glob.sync(pattern, {
      cwd: root,
      nodir: true
    }).forEach((match) => {
      files.add(path.resolve(root, match))
    })
  })

  return Array.from(files).sort((a, b) => a.localeCompare(b))
}
