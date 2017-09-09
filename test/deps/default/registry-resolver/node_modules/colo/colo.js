(function (root) {
  'use strict';

  var colors = {
    'bold' : [1, 22, 'font-weight: bold'],
    'italic' : [3, 23, 'font-style: italic'],
    'underline' : [4, 24, 'text-decoration: underline'],
    // inverse is not supported in browser
    'inverse' : [7, 27, ''],
    'white' : [37, 39, 'color: white'],
    'grey' : [90, 39, 'color: grey'],
    'black' : [30, 39, 'color: black'],
    'blue' : [34, 39, 'color: blue'],
    'cyan' : [36, 39, 'color: cyan'],
    'green' : [32, 39, 'color: green'],
    'magenta' : [35, 39, 'color: magenta'],
    'red' : [31, 39, 'color: red'],
    'yellow' : [33, 39, 'color: yellow']
  };
  var colo = {};
  var isBrowser = false;

  if (typeof module !== 'undefined' && module.exports && typeof global === 'object') {
    // node.js
    module.exports = colo;
    module.exports.colog = console.log;
  } else {
    // browser
    isBrowser = true;
    var colog = function() {
      var args = [].slice.call(arguments);
      var message = args.shift();
      if (message && message.msg && message.styles) {
        args.unshift(message.styles);
        args.unshift("%c" + message.msg);
      } else {
        args.unshift(message);
      }
      console.log.apply(console, args);
    };
    if (typeof define !== 'undefined' && define.amd) {
      // amd
      define(function() {
        return {
          colo: colo,
          colog: colog
        };
      });
    } else if (typeof module !== 'undefined' && module.exports) {
      // commonjs like browserify
      module.exports = colo;
      module.exports.colog = console.log;
    } else {
      // umd
      root.colo = colo;
      root.colog = colog;
    }
  }

  var deco = function(_styles) {
    var decorator = function(str) {
      return decorate.apply(decorator, [str]);
    };
    decorator._styles = _styles;
    decorator.__proto__ = Object.defineProperties(function(){}, styles);
    return decorator;
  };

  var decorate = function(str) {
    var result = str;
    var styles = "";
    this._styles.forEach(function(style) {
      var color = colors[style];
      if (color) {
        if (isBrowser) {
          styles += color[2] + "; ";
        } else {
          result = '\u001b[' + color[0] + 'm' + result + '\u001b[' + color[1] + 'm';
        }
      }
    });
    if (isBrowser) {
      return {msg: result, styles: styles};
    } else {
      return result;
    }
  };

  var styles = (function () {
    var result = {};
    Object.keys(colors).forEach(function (color) {
      result[color] = {
        get: function () {
          if (!this._styles) this._styles = [];
          return deco(this._styles.concat(color));
        }
      };
    });
    return result;
  })();

  Object.defineProperties(colo, styles);
})(this);
