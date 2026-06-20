import { cp } from 'fs/promises'

export default (pkg, cwd) => {
  return cp(pkg.url, cwd, { recursive: true })
}
