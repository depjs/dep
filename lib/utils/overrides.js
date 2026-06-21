// Parse a root package.json `overrides` field into a tree of rules used while
// resolving the dependency graph.
//
// Each rule node is `{ version?, children? }` where `children` is a
// Map<name, node>. The returned value is the root Map<name, node>.
//
// Supported forms:
//   { "foo": "1.2.3" }                    force foo everywhere
//   { "foo": { ".": "1.2.3" } }           force foo's own version
//   { "parent": { "child": "1.2.3" } }    force child only under parent (nested,
//                                          arbitrarily deep)
//   { "foo": "$bar" }                     reuse the root's spec for bar
//
// Out of scope (ignored): version-qualified targets like "foo@2".
const isVersioned = (key) => key.lastIndexOf('@') > 0

export default (overrides, rootJSON) => {
  const rootSpecs = Object.assign(
    {},
    rootJSON.optionalDependencies,
    rootJSON.devDependencies,
    rootJSON.dependencies
  )
  const deref = (spec) =>
    (typeof spec === 'string' && spec[0] === '$' ? (rootSpecs[spec.slice(1)] || spec) : spec)

  const parseNode = (value) => {
    if (typeof value === 'string') return { version: deref(value) }
    const node = {}
    if (!value || typeof value !== 'object') return node
    const children = new Map()
    for (const key of Object.keys(value)) {
      if (key === '.') {
        if (typeof value['.'] === 'string') node.version = deref(value['.'])
      } else if (!isVersioned(key)) {
        children.set(key, parseNode(value[key]))
      }
    }
    if (children.size) node.children = children
    return node
  }

  const rules = new Map()
  if (overrides && typeof overrides === 'object') {
    for (const key of Object.keys(overrides)) {
      if (!isVersioned(key)) rules.set(key, parseNode(overrides[key]))
    }
  }
  return rules
}
