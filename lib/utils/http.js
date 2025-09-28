/* global fetch */
const fs = require('fs')
const { Readable } = require('node:stream')
const { fileURLToPath } = require('node:url')

const isFileUrl = (url) => typeof url === 'string' && url.startsWith('file:')

const ensureResponse = async (url, init = {}) => {
  const response = await fetch(url, { redirect: 'follow', ...init })
  if (!response.ok) {
    const error = new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`)
    error.response = response
    throw error
  }
  return response
}

const requestJson = async (url, init) => {
  if (isFileUrl(url)) {
    const filePath = fileURLToPath(url)
    const content = await fs.promises.readFile(filePath, 'utf8')
    return JSON.parse(content)
  }
  const response = await ensureResponse(url, init)
  return response.json()
}

const requestText = async (url, init) => {
  if (isFileUrl(url)) {
    const filePath = fileURLToPath(url)
    return fs.promises.readFile(filePath, 'utf8')
  }
  const response = await ensureResponse(url, init)
  return response.text()
}

const requestStream = async (url, init) => {
  if (isFileUrl(url)) {
    const filePath = fileURLToPath(url)
    return {
      stream: fs.createReadStream(filePath),
      response: {
        ok: true,
        status: 200,
        statusText: 'OK',
        url
      }
    }
  }
  const response = await ensureResponse(url, init)
  if (!response.body) {
    throw new Error(`Request for ${url} did not return a readable body`)
  }
  return { stream: Readable.fromWeb(response.body), response }
}

module.exports = {
  ensureResponse,
  requestJson,
  requestStream,
  requestText
}
