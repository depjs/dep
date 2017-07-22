module.exports = (list, key, value, walk) => {
  let i = 0
  let limit = walk.length
  let ref = {}
  // optimize the shallowness as much as possible
  // @ToDo need to check the version as well
  while (i < limit) {
    if (!list[walk[i]]) {
      i = 2
      limit -= 2
    }
    ref = list[walk[i]]
    i++
  }
  if (!ref.dependencies) ref.dependencies = {}
  ref.dependencies[key] = value
}
