var traverse = require('traverse');

var quack = module.exports = function (obj) {
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj;
    
    var keys = Object.keys(obj)
        .filter(function (x) { return x !== 'length' })
    ;
    if (keys.length === 0) return obj;
    
    var allNumbers = keys.every(function (key) {
        return !isNaN(key) && parseInt(key, 10) == key && key >= 0;
    });
    if (!allNumbers) return obj;
    
    obj.length = Math.max.apply(null, keys) + 1;
    return [].slice.call(obj);
};

quack.deep = function (obj) {
    return traverse(obj).map(quack);
};
