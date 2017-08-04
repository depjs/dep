module.exports = function(allopts) {
  var n = 0, m = 0, _cb, results = [], _err;
  function o (k, d) { return allopts && allopts[k] !== void 0 ? allopts[k] : d }

  return function(cb) {
    if (cb) {
      results.length = m

      if(_err) {
        var err = _err; _err = null
        return cb(err)
      }
      if(n == m) {
        if (o('spread'))
          return cb.apply(null, [null].concat(results))
        else
        return cb(null, results)
      }

      _cb = cb
      return
    }

    var i = m++
    return function (err) {
      if (err) {
        if (_err) return
        _err = err
        n = -1 // stop
        if (_cb) _cb(err)
      } else {
        n++
        if (o('pluck'))
          results[i] = arguments[o('pluck')]
        else
          results[i] = Array.prototype.slice.call(arguments)
        if (n === m && _cb) {
          if (o('spread'))
            _cb.apply(null, [null].concat(results))
          else
            _cb(null, results)
        }
      }
    }
  }
}
