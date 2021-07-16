module.exports = function(RED)
{
    var lora_packet = require( 'lora-packet' );
    
    function lorawanencode(config)
    {
        RED.nodes.createNode( this, config );
        var   node    = this;
        var   counter = 0;
        const keyconf = RED.nodes.getNode( config.keys );

        node.on('input',function(msg) {
            if( ++counter >= 0xFFFF )
            {
                counter = 0;
            }
            const lora = { MType:   "Unconfirmed Data Up",
                           DevAddr: Buffer.from(msg.payload.device_address,"hex"),
                           FCnt:    counter,
                           FPort:   msg.payload.port,
                           payload: msg.payload.data };
            const key = keyconf.getKey( msg.payload.device_address );
            if( key )
            {
                const packet = lora_packet.fromFields( lora, Buffer.from( key.asw, 'hex' ), Buffer.from( key.nsw, 'hex' ));
                const data = packet.getPHYPayload().toString('Base64');
                msg.payload = { txpk:{ imme: true,
                                modu: "LORA",
                                size: data.length,
                                data: data } };
                node.send( msg );
            }
            else
            {
                node.warn( "unknown deviceid: "+msg.payload.device_address );
            }
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-encoder", lorawanencode );
};
