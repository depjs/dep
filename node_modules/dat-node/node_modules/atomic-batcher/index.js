module.exports = batcher

function batcher (run) {
  var running = false
  var pendingBatch = null
  var pendingCallbacks = null
  var callbacks = null

  return append

  function done (err) {
    if (callbacks) callAll(callbacks, err)

    running = false
    callbacks = pendingCallbacks
    var nextBatch = pendingBatch

    pendingBatch = null
    pendingCallbacks = null

    if (!nextBatch || !nextBatch.length) {
      if (!callbacks || !callbacks.length) {
        callbacks = null
        return
      }
      if (!nextBatch) nextBatch = []
    }

    running = true
    run(nextBatch, done)
  }

  function append (val, cb) {
    if (running) {
      if (!pendingBatch) {
        pendingBatch = []
        pendingCallbacks = []
      }
      pushAll(pendingBatch, val)
      if (cb) pendingCallbacks.push(cb)
    } else {
      if (cb) callbacks = [cb]
      running = true
      run(Array.isArray(val) ? val : [val], done)
    }
  }
}

function pushAll (list, val) {
  if (Array.isArray(val)) pushArray(list, val)
  else list.push(val)
}

function pushArray (list, val) {
  for (var i = 0; i < val.length; i++) list.push(val[i])
}

function callAll (list, err) {
  for (var i = 0; i < list.length; i++) list[i](err)
}
