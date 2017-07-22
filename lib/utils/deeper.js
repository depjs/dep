module.exports = (list, key, value, walk) => {
  let i = 0
  let depth = 1
  let ref = list
  // optimize the shallowness as much as possible
  while (i < walk.length) {
    let name = walk[i].split('@')[0]
    let version = walk[i].split('@')[1]
    let isDeps = name === 'dependencies'
    if (isDeps || (ref[name] && ref[name].version ===  version)) {
      if (isDeps && !ref[name]) ref[name] = {}
      ref = ref[name]
      i++
    } else {
      ref = list
      i = 2 * depth
      depth++
    }
  }

  if (!ref.dependencies) ref.dependencies = {}
  ref.dependencies[key] = value
}
