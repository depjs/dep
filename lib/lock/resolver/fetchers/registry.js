import packument from '../../../utils/packument.js'
import pickVersion from '../../../utils/pick-version.js'

export default async (name, spec, result) => {
  // Full packument so the lockfile can record license/funding.
  const body = await packument(result.escapedName, { full: true })
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
  const scripts = target.scripts || {}
  return {
    type: 'registry',
    name: result.alias,
    version: target.version,
    dependencies: target.dependencies,
    optionalDependencies: target.optionalDependencies,
    peerDependencies: target.peerDependencies,
    peerDependenciesMeta: target.peerDependenciesMeta,
    bundled: target.bundleDependencies || target.bundledDependencies,
    bin: target.bin,
    engines: target.engines,
    os: target.os,
    cpu: target.cpu,
    license: target.license,
    funding: target.funding,
    hasInstallScript: !!(scripts.preinstall || scripts.install || scripts.postinstall),
    tarball: target.dist.tarball,
    shasum: target.dist.shasum,
    integrity: target.dist.integrity
  }
}
