const isRoot = require('is-root')

module.exports = () => {
  if (!isRoot()) return

  const user = process.platform === 'win32' ? 0
    : process.env.SUDO_UID || 'nobody'
  const group = process.platform === 'win32' ? 0
    : process.env.SUDO_GID || (process.getgid && process.getgid())
  try { process.setuid(user) } catch (e) {}
  try { process.setgid(group) } catch (e) {}
}
