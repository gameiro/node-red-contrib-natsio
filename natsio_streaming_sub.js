module.exports = function(RED) {
  function NatsStreamingSubNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;

    node.server = RED.nodes.getNode(n.server);
    node.server.setMaxListeners(node.server.getMaxListeners() + 1);
    node.server.on('Status', (st) => {
      if (st.text == 'connected') {
        const options = node.server.sc
          .subscriptionOptions()
          .setStartWithLastReceived()
          .setDurableName(n.durableName); // TODO: Use from node settings

        node.sid = node.server.sc.subscribe(n.subject, n.durableName, options);

        node.sid.on('message', (msg) => {
          node.send({
            payload: JSON.parse(msg.getData().toString()),
            topic: msg.getSubject()
          });
        });
      }

      this.status(st);
    });

    node.on('close', () => {
      node.server.setMaxListeners(node.server.getMaxListeners() - 1);
    });
  }
  RED.nodes.registerType('natsio-streaming-sub', NatsStreamingSubNode);
};
