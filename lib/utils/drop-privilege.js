const isRoot = require('is-root')

module.exports = () => {
  if (!isRoot()) return
  if (!(process.getuid && process.setuid)) return // uid support
  const user = process.platform === 'win32' ? 0
    : process.env.SUDO_UID || 'nobody'
  const group = process.platform === 'win32' ? 0
    : process.env.SUDO_GID || (process.getgid && process.getgid())
  try {
    process.setuid(user)
    process.setgid(group)
  } catch (e) {
    throw new Error(e)
  }
}
