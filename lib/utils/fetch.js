import { Readable } from 'stream'
import npmrc from './npmrc.js'

// Small wrapper around the global fetch (Node >= 18) so the rest of the code
// base doesn't repeat the User-Agent header or status handling. Replaces the
// deprecated `request` module.
const headers = { 'User-Agent': npmrc.userAgent }

const get = async (url) => {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status} for ${url}`)
  }
  return res
}

export const fetchJSON = async (url) => {
  const res = await get(url)
  return res.json()
}

// Returns a Node readable stream of the response body, ready to pipe into
// gunzip/tar.
export const fetchStream = async (url) => {
  const res = await get(url)
  return Readable.fromWeb(res.body)
}
