module.exports = function(RED) {

    function AndNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property = config.property || "payload";

        node.on('input', function(msg,send,done) {
            const payload = RED.util.getMessageProperty( msg, node.property );

            let data = context.get( "data" ) ?? {};
            data[msg.topic] = payload;
            context.set( "data", data );

            msg.payload = true;
            for( const item in data )
            {
                if( ! data[item] )
                {
                    msg.payload = false;
                    break;
                }
            }

            node.status( msg.payload );
            send( msg );
            done();
        });
    }

    RED.nodes.registerType("and",AndNode);
}
