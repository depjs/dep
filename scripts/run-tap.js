#!/usr/bin/env node
const crypto = require('crypto')
const fs = require('fs')
const fsExtra = require('fs-extra')
const http = require('http')
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

const npmrcPath = path.join(homeDir, '.npmrc')

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

const ensureTarball = (pkg, env) => {
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

const buildMetadata = (pkg, baseUrl) => {
  const tarballUrl = `${baseUrl}/tarballs/${encodeURIComponent(pkg.filename)}`
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
    dependencies: pkg.manifest.dependencies || {},
    dist: {
      shasum: pkg.shasum,
      tarball: tarballUrl
    }
  }
  if (pkg.deprecated) {
    metadata.versions[pkg.version].deprecated = pkg.deprecated
  }
  return metadata
}

const startRegistryServer = (packageData) => {
  const metadataByName = new Map()
  const tarballByFile = new Map()

  const server = http.createServer((req, res) => {
    try {
      if (req.method !== 'GET') {
        res.writeHead(405)
        res.end()
        return
      }
      const requestUrl = new URL(req.url, 'http://127.0.0.1')
      const pathname = requestUrl.pathname

      if (pathname.startsWith('/tarballs/')) {
        const tarballName = decodeURIComponent(pathname.slice('/tarballs/'.length))
        const pkg = tarballByFile.get(tarballName)
        if (!pkg) {
          res.writeHead(404)
          res.end()
          return
        }
        const stream = fs.createReadStream(pkg.tarballPath)
        stream.on('error', () => {
          res.writeHead(500)
          res.end()
        })
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
        stream.pipe(res)
        return
      }

      if (pathname.startsWith('/-/package/') && pathname.endsWith('/dist-tags')) {
        const encodedName = pathname.slice('/-/package/'.length, -'/dist-tags'.length)
        const packageName = decodeURIComponent(encodedName)
        const metadata = metadataByName.get(packageName)
        if (!metadata) {
          res.writeHead(404)
          res.end()
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(metadata['dist-tags']))
        return
      }

      const packageName = decodeURIComponent(pathname.replace(/^\/+/, ''))
      const metadata = metadataByName.get(packageName)
      if (!packageName || !metadata) {
        res.writeHead(404)
        res.end()
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(metadata))
    } catch (error) {
      res.writeHead(500)
      res.end()
    }
  })

  return new Promise((resolve, reject) => {
    server.on('error', reject)
    try {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        const baseUrl = `http://127.0.0.1:${address.port}`
        packageData.forEach((pkg) => {
          const metadata = buildMetadata(pkg, baseUrl)
          metadataByName.set(pkg.name, metadata)
          tarballByFile.set(pkg.filename, pkg)
        })
        const registryUrl = `${baseUrl}/`
        resolve({
          registryUrl,
          close: () => new Promise((_resolve, _reject) => {
            server.close((err) => (err ? _reject(err) : _resolve()))
          })
        })
      })
    } catch (error) {
      reject(error)
    }
  })
}

const setupFileRegistry = (packageData) => {
  packageData.forEach((pkg) => {
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
      dependencies: pkg.manifest.dependencies || {},
      dist: {
        shasum: pkg.shasum,
        tarball: pathToFileURL(pkg.tarballPath).toString()
      }
    }
    if (pkg.deprecated) {
      metadata.versions[pkg.version].deprecated = pkg.deprecated
    }
    const metadataPath = path.join(registryDir, pkg.name)
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  })

  const fileUrl = pathToFileURL(`${registryDir}${path.sep}`).toString()
  const url = new URL(fileUrl)
  if (!url.host) {
    url.host = 'localhost'
  }

  return {
    registryUrl: url.toString(),
    close: () => Promise.resolve()
  }
}

function parseCliArgs (argv) {
  const patterns = []
  const options = {
    coverage: false,
    jobs: null,
    reporter: null,
    timeout: null,
    verbose: false
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
    } else if (arg === '--verbose') {
      options.verbose = true
    } else if (arg === '--no-verbose') {
      options.verbose = false
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

async function main () {
  ensureDir(tmpDir)
  removeDir(runtimeFixturesDir)
  ensureDir(runtimeFixturesDir)
  ensureDir(registryDir)
  ensureDir(tarballDir)

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
    NPM_CONFIG_CACHE: npmCacheDir,
    npm_config_cache: npmCacheDir
  }

  const packageData = packages.map((pkg) => {
    const tarballPath = ensureTarball(pkg, env)
    const manifestPath = path.join(pkg.source, 'package.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const filename = `${pkg.name}-${pkg.version}.tgz`
    const contents = fs.readFileSync(tarballPath)
    const shasum = crypto.createHash('sha1').update(contents).digest('hex')
    return {
      ...pkg,
      filename,
      manifest,
      shasum,
      tarballPath
    }
  })

  let registrySetup
  try {
    registrySetup = await startRegistryServer(packageData)
  } catch (error) {
    if (error && (error.code === 'EPERM' || error.code === 'EACCES')) {
      registrySetup = setupFileRegistry(packageData)
    } else {
      throw error
    }
  }

  const { registryUrl, close } = registrySetup

  env.NPM_CONFIG_REGISTRY = registryUrl
  env.npm_config_registry = registryUrl

  fs.writeFileSync(npmrcPath, `registry=${registryUrl}\n`, 'utf8')
  Object.assign(process.env, env)

  const { patterns, options } = parseCliArgs(process.argv.slice(2))

  if (options.reporter) {
    process.env.TAP_REPORTER = options.reporter
  }

  if (options.coverage) {
    process.env.TAP_COVERAGE = '1'
  }

  const tap = require('tap')

  if (options.verbose) {
    process.env.TAP_VERBOSE = '1'
    process.env.TAP_DEV_SHORTSTACK = '0'
  }

  if (options.timeout != null) {
    const timeout = Math.max(options.timeout, 5000)
    tap.setTimeout(timeout)
  }

  if (options.jobs != null) {
    tap.jobs = options.jobs
  }

  const testFiles = resolveTestFiles(patterns, projectRoot)

  if (testFiles.length === 0) {
    await close()
    console.error('No test files matched the provided pattern(s).')
    process.exit(1)
  }

  tap.on('complete', (results) => {
    if (!results.ok) {
      process.exitCode = 1
    }
  })

  tap.teardown(() => close().catch((error) => {
    console.error(error)
    process.exitCode = 1
  }))

  for (const file of testFiles) {
    require(file)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
