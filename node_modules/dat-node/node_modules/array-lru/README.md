# arraylru

A really fast LRU cache for array items (numeric keys)

```
npm install array-lru
```

[![build status](https://travis-ci.org/mafintosh/array-lru.svg?branch=master)](http://travis-ci.org/mafintosh/array-lru)

Credit to [@dominictarr](https://github.com/dominictarr) for telling me about this neat algorithm for LRUs.

## Usage

``` js
var alru = require('array-lru')
var lru = alru(512) // create a lru that can contain 512 values

lru.set(42, {hello: 'world'})
console.log(lru.get(42)) // {hello: 'world'}
```

It works similar to a normal hash table except when a bucket is full it will
evict the oldest one from the bucket to make room for the new value.

## API

#### `var lru = alru(size, [options])`

Create a new LRU instance. Options include:

``` js
{
  collisions: 4, // how many hash collisions before evicting (default 4)
  evict: fn, // call this function with (index, value) when someone is evicted
  indexedValues: false // set to true if your values has a .index property
}
```

Size should be a multiple of `collections`. If not, it will be coerced into one.

### `var value = lru.get(index)`

Get a value from the cache. If the index is not found, `null` is returned.

### `lru.set(index, value)`

Insert a new value in the cache. If there is no room in the hash bucket that
`index` maps to, the oldest value in the bucket will be evicted.

### Performance

On my MacBook 12" I can set/get around 7.500.000 values per second, YMMV.
Run the benchmark using `npm run bench` to test it for yourself.

## License

MIT
