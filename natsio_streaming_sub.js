function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
  
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
          // validate msg payload
          const jsonString = msg.getData().toString();
          const payload = isJson(jsonString) ? JSON.parse(jsonString) : {};
          node.send({
            payload: payload,
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
