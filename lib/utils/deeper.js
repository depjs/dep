module.exports = (list, value, keys) => {
  let i = 0
  let ref = {}
  for (i = 0; i < keys.length - 1; i++) {
    if (!list[keys[i]]) list[keys[i]] = {}
    ref = list[keys[i]]
  }
  ref[keys[i]] = value
}
