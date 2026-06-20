// Standalone helper spawned (detached) by update-notifier.js. It fetches the
// latest published version and records it in the cache so the next CLI run can
// notify without hitting the network.
import npmrc from './npmrc.js'
import { fetchJSON } from './fetch.js'
import { writeCache } from './update-notifier.js'

const name = process.argv[2]

if (name) {
  fetchJSON(`${npmrc.registry}${name}`)
    .then((body) => {
      const latest = body['dist-tags'] && body['dist-tags'].latest
      writeCache({ lastCheck: Date.now(), latest: latest || null })
    })
    .catch(() => {})
}
