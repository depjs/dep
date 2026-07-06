import path from 'path'
import { rm } from 'fs/promises'
import nm from '../utils/nm.js'
import limit from './limit.js'
import registry from './installer/registry.js'
import matchesPlatform from '../utils/platform.js'

// A cold install used to run in two strictly serial phases: resolve the whole
// tree, then download and extract it. But a registry package's tarball URL
// and integrity are final the moment its metadata arrives, so the resolver
// reports each resolved package here (via resolve-tree's `onMeta`) and its
// download + extraction starts right away, into a staging directory. By the
// time the tree is built most packages are already on disk and the installer
// only renames them into place. Prefetches run through the installer's own
// bounded pool, so total download/extract concurrency is unchanged.

const staging = path.join(nm, '.dep-staging')
const controller = new AbortController()
const staged = new Map() // tarball URL -> { dir, promise }
let count = 0

export const prefetch = (meta) => {
  if (meta.type !== 'registry' || !meta.tarball) return
  if (staged.has(meta.tarball)) return
  // A package the tree build will skip anyway (another platform's optional
  // variant) is not worth downloading.
  if (!matchesPlatform(meta)) return
  // Running as root: files written now would keep root ownership after the
  // privilege drop that precedes the install phase, so stage nothing and let
  // the (dropped) installer fetch everything.
  if (process.getuid && process.getuid() === 0) return
  const dir = path.join(staging, String(count++))
  const promise = limit(() => registry(meta, dir, controller.signal))
  // The installer (or cleanup) observes the rejection; without this extra
  // branch a failed prefetch nobody consumed yet would surface as an
  // unhandled rejection.
  promise.catch(() => {})
  staged.set(meta.tarball, { dir, promise })
}

// One-shot: the first installer task for this URL takes the staged copy; a
// nested duplicate of the same version downloads normally.
export const takeStaged = (url) => {
  const entry = staged.get(url)
  if (entry) staged.delete(url)
  return entry
}

// A failed install must not keep downloading in the background.
export const abortPrefetch = () => controller.abort()

// Abort whatever nobody consumed, wait for it to settle, then remove the
// staging directory.
export const cleanupStaging = async () => {
  controller.abort()
  await Promise.allSettled([...staged.values()].map((entry) => entry.promise))
  await rm(staging, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
}
