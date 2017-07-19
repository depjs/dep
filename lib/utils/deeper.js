module.exports = (list, value, keys) => {
  let i = 0
  let ref = {}
  // optimize the shallowness as much as possible
  for (i = 0; i < keys.length - 2; i++) {
    if (!list[keys[i]]) {
      list[keys[i]] = {}
    }
    ref = list[keys[i]]
    if (!list[keys[i + 1]]) {
      i = keys.length - 3
    }
  }
  if (!ref[keys[i]]) ref[keys[i]] = {}
  ref[keys[i]][keys[i + 1]] = value
}
