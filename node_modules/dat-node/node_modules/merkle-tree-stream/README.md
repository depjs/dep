# merkle-tree-stream

A stream that generates a merkle tree based on the incoming data.

```
npm install merkle-tree-stream
```

[![build status](http://img.shields.io/travis/mafintosh/merkle-tree-stream.svg?style=flat)](http://travis-ci.org/mafintosh/merkle-tree-stream)

## Usage

``` js
var merkleStream = require('merkle-tree-stream')
var crypto = require('crypto')

var stream = merkleStream({
  leaf: function (leaf, roots) {
    // this function should hash incoming data
    // roots in the current partial roots of the merkle tree
    return crypto.createHash('sha256').update(leaf.data).digest()
  },
  parent: function (a, b) {
    // hash two merkle tree node hashes into a new parent hash
    return crypto.createHash('sha256').update(a.hash).update(b.hash).digest()
  }
})

stream.write('hello')
stream.write('hashed')
stream.write('world')

stream.on('data', function (data) {
  console.log(data)
})
```

Running the above will print

```
{ index: 0,
  parent: 1,
  hash: <Buffer 2c f2 4d ba 5f b0 a3 0e 26 e8 3b 2a c5 b9 e2 9e 1b 16 1e 5c 1f a7 42 5e 73 04 33 62 93 8b 98 24>,
  data: <Buffer 68 65 6c 6c 6f> } // 'hello' as buffer
{ index: 2,
  parent: 1,
  hash: <Buffer 1a 06 df 82 4e d7 41 b5 3c 78 50 79 a6 34 7f 00 ee c5 af 82 f9 85 07 75 40 9c a6 9d ff 40 68 a6>,
  data: <Buffer 68 61 68 73 65 64> } // 'hashed' as buffer
{ index: 1,
  parent: 3,
  hash: <Buffer 75 93 7d 52 c2 63 23 6d 6a 05 8e f9 c2 a6 2d d5 20 d8 c6 d0 c0 f4 a0 83 57 29 e5 97 99 25 c4 d4>,
  data: null }
{ index: 4,
  parent: 5,
  hash: <Buffer 48 6e a4 62 24 d1 bb 4f b6 80 f3 4f 7c 9a d9 6a 8f 24 ec 88 be 73 ea 8e 5a 6c 65 26 0e 9c b8 a7>,
  data: <Buffer 77 6f 72 6c 64> } // 'world' as buffer
```

`index` is the tree node index. all even numbers are data nodes (will have a non-null `data` property).

`parent` is the index of a tree node's parent node.

`hash` is the hash of a tree node.

You can always access the current partial roots of the merkle tree by accessing `stream.roots`.
If the number of nodes written to the stream is not a power of `2` then `stream.roots` will
contain more than 1 node (at most `log2(number-of-nodes-written)`). Otherwise it will contain just a single root.

Optionally you can also pass in an array of `roots` in the options map as `{roots: roots}` to continue adding data
to a previously generated merkle tree.

## Low-level interface

A non stream low-level interface can required by doing `require('merkle-tree-stream/generator')`.

``` js
var generator = require('merkle-tree-stream/generator')
var gen = generator({leaf: ..., parent: ...}) // same options as above

var nodes = gen.next('some data')
console.log(nodes) // returns the tree nodes generated, similar to the stream output
console.log(gen.roots) // contains the current roots nodes
```

## Related

See [mafintosh/flat-tree](https://github.com/mafintosh/flat-tree) for more information about
how node/parent indexes are calculated.

## License

MIT
