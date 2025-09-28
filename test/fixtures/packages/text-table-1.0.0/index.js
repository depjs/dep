module.exports = function table (rows) {
  return rows.map((row) => row.join(' ')).join('\n')
}
