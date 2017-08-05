# append-tree

Model a tree structure on top of an append-only log.

```
npm install append-tree
```

[![Build Status](https://travis-ci.org/mafintosh/append-tree.svg?branch=master)](https://travis-ci.org/mafintosh/append-tree)

The data structure stores a small index for every entry in the log, meaning no external indexing is required to model the tree. Also means that you can perform fast lookups on sparsely replicated logs.

## Usage

``` js
var tree = require('append-tree')
var hypercore = require('hypercore')

var feed = hypercore('./my-tree')
var tr = tree(feed, {valueEncoding: 'utf-8'})

tr.put('/hello', 'world', function (err) {
  if (err) throw err

  tr.get('/hello', function (err, val) {
    if (err) throw err
    console.log(val) // <-- 'world'

    tr.list('/', function (err, list) {
      if (err) throw err
      console.log(list) // <-- ['hello']
    })
  })
})
```

## API

#### `var tr = tree(feed, [options])`

Create a new append tree.

First option should be a [hypercore](https://github.com/mafintosh/hypercore) feed (or any append-only log that supports `.append()` and `.length`).

Options include:

``` js
{
  valueEncoding: 'binary' | 'utf-8' | 'json' | anyAbstractEncoding,
  offset: 0 // optional feed offset where the tree starts
}
```

#### `tr.put(name, value, [callback])`

Insert a new node in the tree.

#### `tr.del(name, [callback])`

Delete a node from the tree.

#### `tr.get(name, [options], callback)`

Retrieve a value from the tree. Accepts the same options as [hypercore's get](https://github.com/mafintosh/hypercore#feedgetindex-options-callback) method.

#### `tr.list(name, [options], callback)`

List all immediate children of a node. Similar to doing a `readdir` in a file system. Accepts the same options as [hypercore's get](https://github.com/mafintosh/hypercore#feedgetindex-options-callback) method.

#### `tr.path(name, [options], callback)`

Will call the callback with a list of feed indexes needed to lookup the given name.
Useful if you are replicating the tree and want to avoid roundtrips. Accepts the same options as [hypercore's get](https://github.com/mafintosh/hypercore#feedgetindex-options-callback) method.

#### `var stream = tr.history([options])`

Create a history stream containing all the changes in the tree. Accepts the same options as [hypercore's createReadStream](https://github.com/mafintosh/hypercore#var-stream--feedcreatereadstreamoptions) method.

Each data event looks like this

``` js
{
  type: 'put' | 'del',
  version: 42, // version of the tree at this point in time
  name: '/foo',
  value: new Buffer('bar') // null if it is a del
}
```

#### `tr.version`

Number describing the current version of the tree.

Populated initially after `ready` event. Will be `-1` before.

#### `tr.on('ready', cb)`

Fired when the tree is ready and all properties have been populated.

#### `var oldTree = tr.checkout(version, [options])`

Checkout an old readonly version of the tree. `.get`, `.list` will return the same values as the tree did at the old version.
Accepts the same options as the tree constructor.

#### `var stream = tr.diff(checkout, [options])`

Diff a tree against another checkout of the tree.
Will emit the same data as the history stream but representing the diff from `tr` to `checkout`.

Accepts the same options as [hypercore's createReadStream](https://github.com/mafintosh/hypercore#var-stream--feedcreatereadstreamoptions) method.

## License

MIT
