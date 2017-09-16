const isRoot = require('./is-root')

module.exports = () => {
  if (!isRoot()) return
  if (process.getuid && process.setuid) {
    var group = process.platform === 'win32' ? 0
      : process.env.SUDO_GID || 'nobody'
    if (!isNaN(group)) group = +group
    try {
      process.setgid(group)
    } catch (e) {
      throw new Error(e)
    }
  }
  if (process.getuid && process.setuid) {
    var user = process.platform === 'win32' ? 0
      : process.env.SUDO_UID || 'nobody'
    if (!isNaN(user)) user = +user
    try {
      process.setuid(user)
    } catch (e) {
      throw new Error(e)
    }
  }
}
