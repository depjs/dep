const getter = (list, keys) => {
  let ref = list
  while (keys.length) {
    const key = keys.shift()
    if (key in ref) {
      ref = ref[key]
    } else {
      return
    }
  }
  return ref
}

const setter = (list, key, value, walk) => {
  let i = 0
  let depth = 1
  let ref = list
  // optimize the shallowness as much as possible
  while (i < walk.length) {
    const words = walk[i].split('@')
    const name = words.length === 3
      ? '@' + walk[i].split('@')[0] + walk[i].split('@')[1]
      : walk[i].split('@')[0]
    const version = words.length === 3
      ? walk[i].split('@')[2]
      : walk[i].split('@')[1]
    const isDeps = name === 'dependencies'
    if (isDeps || (ref[name] && ref[name].version === version)) {
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

export { getter, setter }
