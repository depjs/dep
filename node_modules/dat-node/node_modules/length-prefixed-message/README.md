#length-prefixed-message


[![build status](https://travis-ci.org/sorribas/length-prefixed-message.png)](https://travis-ci.org/sorribas/length-prefixed-message.png)

Reads and writes binary length prefixed messages.

##Install

```
npm install length-prefixed-message
```

##Example

```js
var lpm = require('length-prefixed-message');

lpm.read(someStream, function(msgBuffer) {
    console.log(msgBuffer.toString());
});

lpm.write(someOtherStream, new Buffer('hello world'));

// or you can just pass a string if you want.
lpm.write(someOtherStream, 'hello world');
```
