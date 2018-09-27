var nats = require('nats');
var stan = require('node-nats-streaming');

module.exports = function(RED) {
  function RemoteStreamingServerNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var user = node.credentials.username;
    var pass = node.credentials.password;

    let server = 'nats://';
    if (user) {
      server += user + (pass ? ':' + pass : '') + '@';
    }
    server += `${n.host}:${n.port}`;
    console.log(server);

    node.sc = stan.connect(
      n.clusterId,
      n.clientId,
      {
        nc: nats.connect({
          servers: [server], // TODO: make it possible to comma-separate multiple
          waitOnFirstConnect: true,
          maxReconnectAttempts: -1,
          reconnectTimeWait: 250,
          encoding: 'binary'
        })
      }
    );

    node.sc.on('error', (e) => {
      node.log(e);
      node.emit('Status', {fill: 'red', shape: 'dot', text: 'Broker not found'});
    });
    node.sc.on('connect', () => {
      node.emit('Status', {fill: 'green', shape: 'dot', text: 'connected'});
    });
    node.sc.on('reconnecting', () => {
      node.emit('Status', {fill: 'green', shape: 'ring', text: 'connecting'});
    });
    node.sc.on('reconnected', () => {
      node.emit('Status', {fill: 'green', shape: 'dot', text: 'reconnected'});
    });
    node.sc.on('disconnect', () => {
      node.emit('Status', {fill: 'red', shape: 'ring', text: 'disconnected'});
    });

    node.on('close', () => {
      if (node.sc || !node.sc.closed) {
        node.sc.close();
      }
    });
  }

  RED.nodes.registerType('natsio-streaming-server', RemoteStreamingServerNode, {
    credentials: {
      username: {type: 'text'},
      password: {type: 'password'}
    }
  });
};
