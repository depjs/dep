module.exports = (list, keys) => {
  let ref = list;
  while (keys.length) {
    let key = keys.shift()
    if (key in ref) {
      ref = ref[key]
    } else {
      return
    }
  }
  return ref
}
