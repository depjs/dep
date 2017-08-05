// taken from https://github.com/tiborv/memory-cache-ttl

'use strict';

var options = {};
var cache = {};
var ttlQueue = [];
var ttlExtend = new Set();

var genExpire = function genExpire(seconds) {
  var t = new Date();
  t.setSeconds(t.getSeconds() + seconds);
  return t;
};

var binarySearch = function binarySearch(value) {
  var low = 0;
  var high = ttlQueue.length;

  while (low < high) {
    var mid = low + high >>> 1; // eslint-disable-line no-bitwise
    if (ttlQueue[mid].expires.getTime() < value) low = mid + 1;else high = mid;
  }
  return low;
};

var addToTTLQueue = function addToTTLQueue(ttl) {
  ttlQueue = ttlQueue.filter(function (e) {
    return e.id !== ttl.id;
  });
  ttlQueue.splice(binarySearch(ttl.expires.getTime()), 0, ttl);
};

var cleanExpired = function cleanExpired() {
  if (ttlQueue.length === 0) return;
  var now = new Date().getTime();
  if (ttlQueue[0].expires.getTime() > now) return;
  var expiredIndex = binarySearch(now);
  ttlQueue.slice(0, expiredIndex).map(function (ttl) {
    return delete cache[ttl.id];
  });
  ttlQueue = ttlQueue.slice(expiredIndex, ttlQueue.length);
};

var set = function set(id, value, ttl) {
  if (!ttl && !options.ttl) throw new Error('Global or local TTL needs to be set');
  cache[id] = value;
  if (ttl) return addToTTLQueue({ id: id, expires: genExpire(ttl) });
  addToTTLQueue({
    id: id,
    expires: options.randomize ? genExpire(Math.ceil(Math.random() * options.ttl)) : genExpire(options.ttl)
  });
};

var check = function check(id) {
  return id in cache;
};

var get = function get(id) {
  if (options.extendOnHit) ttlExtend.add(id);
  return cache[id];
};

var del = function del(id) {
  delete cache[id];
  ttlQueue = ttlQueue.filter(function (t) {
    return t.id !== id;
  });
};

var list = function list() {
  return cache;
};

var flush = function flush() {
  cache = {};
  ttlQueue = [];
};

var onInterval = function onInterval() {
  if (ttlQueue.length === 0) return;
  ttlQueue.forEach(function (ttl) {
    options.onInterval(ttl.id).then(function () {
      var newValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : cache[ttl.id];

      cache[ttl.id] = newValue;
    });
  });
};

var extendOnHit = function extendOnHit() {
  if (ttlExtend.size === 0) return;
  ttlExtend.forEach(function (id) {
    return set(id, cache[id]);
  });
  ttlExtend = new Set();
};

var runningProcess = void 0;
var runTasks = function runTasks() {
  if (runningProcess) clearInterval(runningProcess);
  runningProcess = setInterval(function () {
    if (options.extendOnHit) extendOnHit();
    cleanExpired();
    if (options.onInterval) onInterval();
  }, options.interval * 1000);
};

var init = function init() {
  var o = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { interval: 1 };

  options = o;
  if (o.onInterval && typeof o.onInterval !== 'function') {
    throw new Error('onInterval needs to be a Promise/function');
  }
  runTasks();
};

exports.default = {
  init: init,
  set: set,
  get: get,
  check: check,
  del: del,
  list: list,
  flush: flush,
  __ttlQueue: function __ttlQueue() {
    return ttlQueue;
  },
  stats: function stats() {
    return {
      cacheEntries: Object.keys(cache).length,
      ttlQueueEntries: ttlQueue.length,
      ttlExtendEntries: ttlExtend.size
    };
  }
};
module.exports = exports['default'];