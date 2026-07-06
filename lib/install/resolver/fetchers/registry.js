import packument from '../../../utils/packument.js'
import pickVersion from '../../../utils/pick-version.js'
import npmrc from '../../../utils/npmrc.js'
import { fetchJSON } from '../../../utils/fetch.js'
import matchesPlatform from '../../../utils/platform.js'

// The abbreviated packument never carries `libc`, yet a Linux binary's glibc
// and musl variants are distinguishable only by it. For os-restricted packages
// that pass the os/cpu check here on Linux, fetch the picked version's own
// manifest — a small single-version document, not the full packument — to
// learn its libc restriction. Best-effort: on failure the package simply
// keeps no restriction, as npm behaves.
const libcCache = new Map()
const libcOf = (escapedName, target) => {
  if (process.platform !== 'linux' || !target.os ||
      !matchesPlatform({ os: target.os, cpu: target.cpu })) return undefined
  const key = `${escapedName}@${target.version}`
  if (!libcCache.has(key)) {
    libcCache.set(key, fetchJSON(`${npmrc.registry}${escapedName}/${target.version}`)
      .then((manifest) => manifest.libc)
      .catch(() => undefined))
  }
  return libcCache.get(key)
}

export default async (name, spec, result) => {
  const body = await packument(result.escapedName)
  const version = pickVersion(body, spec)
  const target = version && body.versions[version]
  if (!target) {
    throw new Error(`No matching version found for ${name}@${spec}`)
  }
  if (target.deprecated) {
    process.stdout.write(
      `${target.name}@${target.version}: ${target.deprecated}\n\n`
    )
  }
  return {
    type: 'registry',
    // For an alias (`foo: npm:bar@x`) record the real package name so the
    // lockfile can note it; absent for normal deps.
    name: result.alias,
    version: target.version,
    dependencies: target.dependencies,
    optionalDependencies: target.optionalDependencies,
    peerDependencies: target.peerDependencies,
    peerDependenciesMeta: target.peerDependenciesMeta,
    bundled: target.bundleDependencies || target.bundledDependencies,
    // The abbreviated packument carries `bin` and `hasInstallScript`, letting
    // the installer skip re-reading each extracted package.json. `null`/`false`
    // mean known-absent, as opposed to undefined (metadata unavailable).
    bin: target.bin || null,
    hasInstallScript: !!target.hasInstallScript,
    engines: target.engines,
    os: target.os,
    cpu: target.cpu,
    libc: await libcOf(result.escapedName, target),
    tarball: target.dist.tarball,
    shasum: target.dist.shasum,
    integrity: target.dist.integrity
  }
}
