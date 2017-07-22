module.exports = (list, key, value, walk) => {
  let i = 0
  let depth = 1
  let ref = {}
  // optimize the shallowness as much as possible
  while (i < walk.length) {
    if (!list[walk[i]]) {
      i = 2 * depth
      depth++
    } else {
      ref = list[walk[i]]
      i++
    }
  }
  if (!ref.dependencies) ref.dependencies = {}
  ref.dependencies[key] = value
}
