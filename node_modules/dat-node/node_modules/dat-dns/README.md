# dat-dns

Issue DNS lookups for Dat archives using HTTPS requests to the target host. Keeps an in-memory cache of recent lookups.

## API

```js
var datDns = require('dat-dns')()

// resolve a name: pass the hostname by itself
datDns.resolveName('foo.com', function (err, key) { ... })
datDns.resolveName('foo.com').then(key => ...)

// dont use cached 'misses'
datDns.resolveName('foo.com', {ignoreCachedMiss: true})

// dont use the cache at all
datDns.resolveName('foo.com', {ignoreCache: true})

// list all entries in the cache
datDns.listCache()

// clear the cache
datDns.flushCache()
```

## Spec

[In detail.](https://github.com/beakerbrowser/beaker/wiki/Authenticated-Dat-URLs-and-HTTPS-to-Dat-Discovery)

Place a file at `/.well-known/dat` with the following schema:

```
{dat-url}
TTL={time in seconds}
```

TTL is optional and will default to `3600` (one hour). If set to `0`, the entry is not cached.

### Dat-name Resolution

Resolution of a site at `dat://hostname` will occur with the following process:

 - Browser checks its dat names cache. If a non-expired entry is found, return with the entry.
 - Browser issues a GET request to `https://hostname/.well-known/dat`.
 - If the server responds with a `404 Not Found` status, store a null entry in the cache with a TTL of `3600` and return a failed lookup.
 - If the server responds with anything other than a `200 OK` status, return a failed lookup.
 - If the server responds with a malformed file, return a failed lookup.
 - If the response includes no TTL, set to default `3600`.
 - If the response includes a non-zero TTL, store the entry in the dat-name cache.
 - Return the entry.