var mutexify = function() {
  var queue = []
  var used = null

  var call = function () {
    used(release)
  }

  var acquire = function (fn) {
    if (used) return queue.push(fn)
    used = fn
    process.nextTick(call)
    return 0
  }

  var release = function (fn, err, value) {
    used = null
    if (queue.length) acquire(queue.shift())
    if (fn) fn(err, value)
  }

  return acquire
}

module.exports = mutexify