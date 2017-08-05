# Dat Swarm Defaults

Use Dat defaults for `dns` and `dht` servers in [hyperdiscovery](https://github.com/karissa/hyperdiscovery) or [discovery-swarm](https://github.com/mafintosh/discovery-swarm). The *dns* and *dht* servers are used to discover other peers.

## Usage 

Create a config object and pass it to discovery swarm. 

Any options you specify will overwrite the defaults. See discovery swarm for options.

```javascript
var Swarm = require('discovery-swarm')
var defaults = require('dat-swarm-defaults')

var config = defaults({
  stream: function () {
    return drive.createPeerStream()
  }
})
var swarm = Swarm(config)
```
