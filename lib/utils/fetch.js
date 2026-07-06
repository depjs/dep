import { Readable } from 'stream'
import npmrc from './npmrc.js'
import authHeaderFor from './auth.js'

// Credentials embedded in a URL (https://user:pass@host/...) must never reach
// an error message.
const redact = (url) => String(url).replace(/\/\/[^@/]*@/, '//***@')

// Small wrapper around the global fetch (Node >= 18) so the rest of the code
// base doesn't repeat the User-Agent header or status handling. Replaces the
// deprecated `request` module.
const get = async (url, accept, signal) => {
  const headers = { 'User-Agent': npmrc.userAgent }
  if (accept) headers.Accept = accept
  const auth = authHeaderFor(url)
  if (auth) headers.Authorization = auth
  const res = await fetch(url, { headers, signal })
  if (!res.ok) {
    let msg = `Request failed with status ${res.status} for ${redact(url)}`
    if ((res.status === 401 || res.status === 403) && !auth) {
      msg += ' (hint: authenticate with //<registry-host>/:_authToken=<token> in .npmrc)'
    }
    throw new Error(msg)
  }
  return res
}

export const fetchJSON = async (url, accept) => {
  const res = await get(url, accept)
  return res.json()
}

// Returns a Node readable stream of the response body, ready to pipe into
// gunzip/tar. An optional AbortSignal cancels the request and destroys the
// body stream.
export const fetchStream = async (url, signal) => {
  const res = await get(url, undefined, signal)
  return Readable.fromWeb(res.body)
}
