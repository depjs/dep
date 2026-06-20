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
    version: target.version,
    dependencies: target.dependencies,
    tarball: target.dist.tarball,
    shasum: target.dist.shasum,
    integrity: target.dist.integrity
  }
}
