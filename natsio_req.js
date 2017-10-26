var nats = require('nats');

module.exports = function(RED) {

  function NatsRequestNode(n) {
    RED.nodes.createNode(this, n);

    this.server = RED.nodes.getNode(n.server);
    if(this.server.nc) {
      this.status({fill:"green",shape:"dot",text:"connected"});
    } else {
      this.status({fill:"red",shape:"ring",text:"disconnected"});
    }

    var node = this;

    node.on('input', function(msg) {
      var subject = msg.replyTo || msg.topic || config.subjec;
      var opt_msg = msg.payload || n.message || null
      var opt_options = null // work in options
      if(subject){
        node.server.nc.request(subject, opt_msg, opt_options, function(response) {
          msg.payload = response
          node.send(msg);
        })
      }
    });

    node.on('close', function() {
      if (node.server.nc) {
        node.server.nc.close();
      }
    });
  }
  RED.nodes.registerType("nats-request",NatsRequestNode);
}