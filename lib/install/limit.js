import pool from '../utils/pool.js'

// Bound the number of tarball downloads / extractions / git clones running at
// once so deep trees don't open thousands of sockets and file handles. The
// pool is shared by the installer and the resolution-time prefetch, keeping
// total download/extract concurrency at one limit.
export const CONCURRENCY = Math.max(1, Number(process.env.DEP_CONCURRENCY) || 16)

export default pool(CONCURRENCY)
