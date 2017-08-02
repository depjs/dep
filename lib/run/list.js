module.exports = (pkg) => {
  const scripts = pkg.scripts
  process.stdout.write(
    'Available scripts via `dep run`\n\n' +
    Object.keys(scripts).map((key) => {
      return 'dep run ' + key + ':\n  ' + scripts[key]
    }).join('\n') + '\n'
  )
}
