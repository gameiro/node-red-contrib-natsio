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

        // validate msg payload
        const payload = isJson(msg.getData().toString()) ? msg.getData().toString() : {};
        
        if (IsJsonString)
        node.sid.on('message', (msg) => {
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
