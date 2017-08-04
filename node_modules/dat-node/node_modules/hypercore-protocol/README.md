# hypercore-protocol

Stream that implements the [hypercore](https://github.com/mafintosh/hypercore) protocol

```
npm install hypercore-protocol
```

[![build status](https://travis-ci.org/mafintosh/hypercore-protocol.svg?branch=master)](https://travis-ci.org/mafintosh/hypercore-protocol)

## Usage

``` js
var protocol = require('hypercore-protocol')
var stream = protocol()

// open a feed specified by a 32 byte key
var feed = stream.feed(Buffer('deadbeefdeadbeefdeadbeefdeadbeef'))

feed.request({block: 42})
feed.on('data', function (message) {
  console.log(message) // contains message.index and message.value
})

stream.pipe(anotherStream).pipe(stream)
```

## API

#### `var stream = protocol([options])`

Create a new protocol duplex stream.

Options include:

``` js
{
  id: optionalPeerId, // you can use this to detect if you connect to yourself
  live: keepStreamOpen, // signal to the other peer that you want to keep this stream open forever
  userData: opaqueUserData // include user data that you can retrieve on handshake
  encrypt: true, // set to false to disable encryption if you are already piping through a encrypted stream
  timeout: 5000 // stream timeout. set to 0 or false to disable.
}
```

If you don't specify a peer id a random 32 byte will be used.
You can access the peer id using `p.id` and the remote peer id using `p.remoteId`.

#### `var feed = stream.feed(key)`

Signal the other end that you want to share a hypercore feed.

You can use the same stream to share more than one BUT the first feed shared
should be the same one. The key of the first feed is also used to encrypt the stream using [libsodium](https://github.com/mafintosh/sodium-native#crypto_stream_xorcipher-message-nonce-key).

#### `stream.on('handshake')`

Emitted when a protocol handshake has been received. Afterwards you can check `.remoteId` to get the remote peer id, `.remoteLive` to get its live status, or `.remoteUserData` to get its user data.

#### `stream.on('feed', discoveryKey)`

Emitted when a remote is sharing a feed. `discoveryKey` is the hypercore discovery key of the feed they want to share.

If you are sharing multiple hypercores on the same port you can use this event to wait for the remote peer to indicate which hypercore
they are interested in.

#### `stream.destroy([error])`

Destroy the stream. Closes all feeds as well.

#### `stream.finalize()`

Gracefully end the stream. Closes all feeds as well.

#### `feed.info(message)`

Send an `info` message. See the [schema.proto](schema.proto) file for more information.

#### `feed.on('info', message)`

Emitted when an `info` message has been received.

#### `feed.have(message)`

Send a `have` message. See the [schema.proto](schema.proto) file for more information.

#### `feed.on('have', message)`

Emitted when a `have` message has been received.

#### `feed.unhave(message)`

Send a `unhave` message. See the [schema.proto](schema.proto) file for more information.

#### `feed.on('unhave', message)`

Emitted when a `unhave` message has been received.

#### `feed.want(want)`

Send a `want` message. See the [schema.proto](schema.proto) file for more information.

#### `feed.on('want', want)`

Emitted when a `want` message has been received.

#### `feed.unwant(unwant)`

Send a `unwant` message. See the [schema.proto](schema.proto) file for more information.

#### `feed.on('unwant', unwant)`

Emitted when a `unwant` message has been received.

#### `feed.request(request)`

Send a `request` message. See the [schema.proto](schema.proto) file for more information.

#### `feed.on('request', request)`

Emitted when a `request` message has been received.

#### `feed.cancel(cancel)`

Send a `cancel` message. See the [schema.proto](schema.proto) file for more information.

#### `feed.on('cancel', cancel)`

Emitted when a `cancel` message has been received.

#### `feed.data(data)`

Send a `data` message. See the [schema.proto](schema.proto) file for more information.

#### `feed.on('data', data)`

Emitted when a `data` message has been received.

#### `feed.on('close')`

Emitted when this feed has been closed. All feeds are automatically closed when the stream ends or is destroyed.

#### `feed.close()`

Close this feed. You only need to call this if you are sharing a lot of feeds and want to garbage collect some old unused ones.

#### `feed.destroy(err)`

An alias to `stream.destroy`.

## Wire protocol

The hypercore protocol uses a basic varint length prefixed format to send messages over the wire.

All messages contains a header indicating the type and feed id, and a protobuf encoded payload.

```
message = header + payload
```

A header is a varint that looks like this

```
header = numeric-feed-id << 4 | numeric-type
```

The feed id is just an incrementing number for every feed shared and the type corresponds to which protobuf schema should be used to decode the payload.

The message is then wrapped in another varint containing the length of the message

```
wire = length(message) + message + length(message2) + message2 + ...
```

## License

MIT
