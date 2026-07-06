// Minimal semver implementation covering the subset dep needs:
//   valid, gt, satisfies, validRange, maxSatisfying
// Range expansion (caret/tilde/x-range/hyphen) and prerelease precedence follow
// the node-semver algorithm so resolution matches npm's behaviour.

const isX = (s) => s == null || s === '' || /^[xX*]$/.test(s)

// Parse a concrete version into its components, or null if invalid.
// Memoized: resolution matches every packument version against ranges, so the
// same strings parse over and over (a large package has 1000+ versions).
const parseCache = new Map()
const parse = (version) => {
  if (typeof version !== 'string') return null
  let parsed = parseCache.get(version)
  if (parsed === undefined) {
    const m = version.trim().replace(/^[=v]+/, '').match(
      /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
    )
    parsed = m
      ? {
          major: +m[1],
          minor: +m[2],
          patch: +m[3],
          prerelease: m[4]
            ? m[4].split('.').map((id) => (/^\d+$/.test(id) ? +id : id))
            : []
        }
      : null
    parseCache.set(version, parsed)
  }
  return parsed
}

// Split a (possibly partial / x-range) version into raw string parts.
const xParts = (ver) => {
  const m = ver.trim().replace(/^v/, '').match(
    /^(\d+|x|X|\*)(?:\.(\d+|x|X|\*))?(?:\.(\d+|x|X|\*))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
  )
  if (!m) return null
  return { M: m[1], m: m[2], p: m[3], pr: m[4] }
}

const compareIds = (a, b) => {
  if (a === b) return 0
  const an = typeof a === 'number'
  const bn = typeof b === 'number'
  if (an && !bn) return -1
  if (!an && bn) return 1
  return a < b ? -1 : 1
}

const comparePre = (a, b) => {
  if (a.length && !b.length) return -1
  if (!a.length && b.length) return 1
  for (let i = 0; ; i++) {
    if (i >= a.length && i >= b.length) return 0
    if (i >= a.length) return -1
    if (i >= b.length) return 1
    const c = compareIds(a[i], b[i])
    if (c) return c
  }
}

const cmp = (a, b) => {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1
  return comparePre(a.prerelease, b.prerelease)
}

const caret = (ver) => {
  const pt = xParts(ver)
  if (!pt) return null
  const { M, m, p, pr } = pt
  if (isX(M)) return '*'
  if (isX(m)) return `>=${M}.0.0 <${+M + 1}.0.0`
  if (isX(p)) {
    if (M === '0') return `>=${M}.${m}.0 <${M}.${+m + 1}.0`
    return `>=${M}.${m}.0 <${+M + 1}.0.0`
  }
  const lo = `>=${M}.${m}.${p}${pr ? '-' + pr : ''}`
  let hi
  if (M === '0') {
    if (m === '0') hi = `<${M}.${m}.${+p + 1}`
    else hi = `<${M}.${+m + 1}.0`
  } else {
    hi = `<${+M + 1}.0.0`
  }
  return `${lo} ${hi}`
}

const tilde = (ver) => {
  const pt = xParts(ver)
  if (!pt) return null
  const { M, m, p, pr } = pt
  if (isX(M)) return '*'
  if (isX(m)) return `>=${M}.0.0 <${+M + 1}.0.0`
  if (isX(p)) return `>=${M}.${m}.0 <${M}.${+m + 1}.0`
  return `>=${M}.${m}.${p}${pr ? '-' + pr : ''} <${M}.${+m + 1}.0`
}

const xrange = (token) => {
  const split = token.match(/^(>=|<=|>|<|=)?(.*)$/)
  let gtlt = split[1] || ''
  const pt = xParts(split[2])
  if (!pt) return null
  let { M, m, p } = pt
  const xM = isX(M)
  const xm = xM || isX(m)
  const xp = xm || isX(p)
  const anyX = xp
  if (gtlt === '=' && anyX) gtlt = ''
  if (xM) {
    return gtlt === '>' || gtlt === '<' ? '<0.0.0' : '*'
  }
  if (gtlt && anyX) {
    if (xm) m = '0'
    p = '0'
    if (gtlt === '>') {
      gtlt = '>='
      if (xm) { M = +M + 1; m = 0; p = 0 } else { m = +m + 1; p = 0 }
    } else if (gtlt === '<=') {
      gtlt = '<'
      if (xm) M = +M + 1
      else m = +m + 1
    }
    return `${gtlt}${M}.${m}.${p}`
  }
  if (xm) return `>=${M}.0.0 <${+M + 1}.0.0`
  if (xp) return `>=${M}.${m}.0 <${M}.${+m + 1}.0`
  const pr = pt.pr ? '-' + pt.pr : ''
  return gtlt ? `${gtlt}${M}.${m}.${p}${pr}` : `${M}.${m}.${p}${pr}`
}

const hyphenRe = /^\s*([0-9A-Za-z.*xX-]+)\s+-\s+([0-9A-Za-z.*xX-]+)\s*$/

const hyphen = (setStr) => {
  const m = setStr.match(hyphenRe)
  if (!m) return setStr
  const f = xParts(m[1])
  const t = xParts(m[2])
  if (!f || !t) return setStr
  let from
  if (isX(f.M)) from = ''
  else if (isX(f.m)) from = `>=${f.M}.0.0`
  else if (isX(f.p)) from = `>=${f.M}.${f.m}.0`
  else from = `>=${f.M}.${f.m}.${f.p}${f.pr ? '-' + f.pr : ''}`
  let to
  if (isX(t.M)) to = ''
  else if (isX(t.m)) to = `<${+t.M + 1}.0.0`
  else if (isX(t.p)) to = `<${t.M}.${+t.m + 1}.0`
  else to = `<=${t.M}.${t.m}.${t.p}${t.pr ? '-' + t.pr : ''}`
  return `${from} ${to}`.trim()
}

const ANY = { op: '>=', v: { major: 0, minor: 0, patch: 0, prerelease: [] } }

const parseComparator = (c) => {
  const m = c.match(/^(>=|<=|>|<|=)?(.*)$/)
  const v = parse(m[2])
  if (!v) return null
  return { op: m[1] || '=', v }
}

// Expand one comparator set (space separated) into simple comparators.
const parseSet = (setStr) => {
  setStr = setStr.trim()
  if (setStr === '') return [ANY]
  setStr = hyphen(setStr)
  // Ranges like ">= 12.0.0" or "^ 1.2.3" put whitespace between the operator
  // and the version; collapse it so the whitespace split below doesn't turn
  // the operator into a dangling (invalid) token.
  setStr = setStr.replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1')
  const comps = []
  for (const token of setStr.split(/\s+/)) {
    if (!token) continue
    let expanded
    if (token[0] === '^') expanded = caret(token.slice(1))
    else if (token[0] === '~') expanded = tilde(token.slice(1))
    else expanded = xrange(token)
    if (expanded == null) return null
    if (expanded === '*' || expanded === '') {
      comps.push(ANY)
      continue
    }
    for (const part of expanded.split(/\s+/)) {
      const parsed = parseComparator(part)
      if (!parsed) return null
      comps.push(parsed)
    }
  }
  return comps.length ? comps : [ANY]
}

// Memoized like `parse`: maxSatisfying tests one range against every version
// of a packument, and the same handful of ranges recurs across the tree.
const rangeCache = new Map()
const parseRange = (range) => {
  range = String(range == null ? '' : range).trim()
  let result = rangeCache.get(range)
  if (result === undefined) {
    result = []
    for (const set of range.split(/\s*\|\|\s*/)) {
      const comps = parseSet(set)
      if (comps === null) {
        result = null
        break
      }
      result.push(comps)
    }
    rangeCache.set(range, result)
  }
  return result
}

const testComparator = (v, c) => {
  const r = cmp(v, c.v)
  switch (c.op) {
    case '>': return r > 0
    case '>=': return r >= 0
    case '<': return r < 0
    case '<=': return r <= 0
    default: return r === 0
  }
}

const satisfiesSet = (v, set) => {
  for (const c of set) {
    if (!testComparator(v, c)) return false
  }
  // A prerelease version only satisfies a set that explicitly mentions a
  // prerelease sharing the same [major, minor, patch] tuple.
  if (v.prerelease.length) {
    const allowed = set.some((c) =>
      c.v.prerelease.length &&
      c.v.major === v.major &&
      c.v.minor === v.minor &&
      c.v.patch === v.patch)
    if (!allowed) return false
  }
  return true
}

export const valid = (version) => {
  const p = parse(version)
  if (!p) return null
  let v = `${p.major}.${p.minor}.${p.patch}`
  if (p.prerelease.length) v += '-' + p.prerelease.join('.')
  return v
}

export const gt = (a, b) => {
  const pa = parse(a)
  const pb = parse(b)
  if (!pa || !pb) return false
  return cmp(pa, pb) > 0
}

export const validRange = (range) => {
  return parseRange(range) ? (String(range).trim() || '*') : null
}

export const satisfies = (version, range) => {
  const v = parse(version)
  if (!v) return false
  const sets = parseRange(range)
  if (!sets) return false
  return sets.some((set) => satisfiesSet(v, set))
}

export const maxSatisfying = (versions, range) => {
  const sets = parseRange(range)
  if (!sets) return null
  let max = null
  let maxParsed = null
  for (const version of versions) {
    const p = parse(version)
    if (!p || !sets.some((set) => satisfiesSet(p, set))) continue
    if (!maxParsed || cmp(p, maxParsed) > 0) {
      max = version
      maxParsed = p
    }
  }
  return max
}

export default { valid, gt, validRange, satisfies, maxSatisfying }
