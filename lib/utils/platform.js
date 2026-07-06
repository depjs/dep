// npm-style platform matching against a package's `os` / `cpu` / `libc`
// fields, each an allow/deny list like ["linux", "!win32"].

// Match one such list against a value; an absent or empty list matches all.
const matchList = (list, value) => {
  if (!list || !list.length) return true
  const positives = list.filter((i) => i[0] !== '!')
  for (const item of list) {
    if (item[0] === '!' && item.slice(1) === value) return false
  }
  return positives.length ? positives.includes(value) : true
}

// The current libc family, detected the way npm does: on Linux the process
// report says whether the runtime links glibc (otherwise musl); elsewhere
// there is none, so a libc-restricted package never matches off-Linux.
let libc
const currentLibc = () => {
  if (libc !== undefined) return libc
  libc = null
  if (process.platform === 'linux') {
    try {
      libc = process.report.getReport().header.glibcVersionRuntime ? 'glibc' : 'musl'
    } catch (e) {}
  }
  return libc
}

export default (meta) =>
  matchList(meta.os, process.platform) &&
  matchList(meta.cpu, process.arch) &&
  matchList(meta.libc, currentLibc())

// The platform demands of a mismatching package, for error messages.
export const describePlatform = (meta) =>
  `os ${JSON.stringify(meta.os || ['any'])}, cpu ${JSON.stringify(meta.cpu || ['any'])}` +
  (meta.libc ? `, libc ${JSON.stringify(meta.libc)}` : '')
