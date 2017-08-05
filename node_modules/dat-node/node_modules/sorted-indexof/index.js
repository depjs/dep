module.exports = indexOf

function indexOf (left, right) {
  var result = new Array(right.length)
  var i = 0
  var j = 0

  while (i < left.length && j < right.length) {
    var a = left[i]
    var b = right[j]

    if (a === b) {
      result[j++] = i
      continue
    }

    if (a < b) {
      i++
      continue
    }

    result[j++] = -1
    continue
  }

  for (; j < right.length; j++) result[j] = -1

  return result
}
