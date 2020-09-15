const getter = (list, keys) => {
  var ref = list
  while (keys.length) {
    var key = keys.shift()
    if (key in ref) {
      ref = ref[key]
    } else {
      return
    }
  }
  return ref
}

const setter = (list, key, value, walk) => {
  var i = 0
  var depth = 1
  var ref = list
  // optimize the shallowness as much as possible
  while (i < walk.length) {
    const words = walk[i].split('@')
    var name = words.length === 3
      ? '@' + walk[i].split('@')[0] + walk[i].split('@')[1]
      : walk[i].split('@')[0]
    var version = words.length === 3
      ? walk[i].split('@')[2]
      : walk[i].split('@')[1]
    var isDeps = name === 'dependencies'
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

module.exports = {
  getter,
  setter
}
