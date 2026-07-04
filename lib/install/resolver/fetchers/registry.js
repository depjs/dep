import packument from '../../../utils/packument.js'
import pickVersion from '../../../utils/pick-version.js'

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
    tarball: target.dist.tarball,
    shasum: target.dist.shasum,
    integrity: target.dist.integrity
  }
}
