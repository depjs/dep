import isRoot from './is-root.js'

const isEnable = process.getuid && process.setuid

export default () => {
  if (!isRoot()) return
  if (!isEnable) return
  let group = process.platform === 'win32'
    ? 0
    : process.env.SUDO_GID || 'nobody'
  if (!isNaN(group)) group = +group
  try {
    process.setgid(group)
  } catch (e) {
    throw new Error(e)
  }
  let user = process.platform === 'win32'
    ? 0
    : process.env.SUDO_UID || 'nobody'
  if (!isNaN(user)) user = +user
  try {
    process.setuid(user)
  } catch (e) {
    throw new Error(e)
  }
}
