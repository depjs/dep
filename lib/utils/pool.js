// Bounded-concurrency runner. Returns a `run(thunk)` that schedules an async
// task (a function returning a promise) and resolves with its result, keeping
// at most `size` tasks in flight at once. Queued tasks start as slots free up.
//
// This caps simultaneous network connections, open file handles and tarball
// extractions so large dependency trees don't exhaust sockets/FDs or trip
// registry rate limits.
export default (size) => {
  let active = 0
  const queue = []

  const next = () => {
    if (active >= size || queue.length === 0) return
    active++
    const { thunk, resolve, reject } = queue.shift()
    Promise.resolve()
      .then(thunk)
      .then(resolve, reject)
      .finally(() => {
        active--
        next()
      })
  }

  return (thunk) => new Promise((resolve, reject) => {
    queue.push({ thunk, resolve, reject })
    next()
  })
}
