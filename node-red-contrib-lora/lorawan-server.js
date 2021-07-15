module.exports = function(RED)
{
    var dgram = require( 'dgram' );
    
    function lorawanserver(config)
    {
        RED.nodes.createNode( this, config );
        var node    = this;
        var server  = dgram.createSocket( 'udp4' );
        var gateway = null;
        var counter = 0;
        var stamp   = 0;

        if( node != null )
        {
            server.bind( config.port );
        }

        // UDP Socket Callbacks

        server.on('listening', function() {
        });

        server.on('error', function (error) {
            node.warn( 'UDP error: ', error );
        })

        server.on('message', function(message, remote) {
            console.log(message);
            if( message.length >= 4 && message[0] == 2 )
            {
                switch( message[3] )
                {
                    case 0: // PUSH_DATA
                        // data
                        const mac  = message.slice( 4, 12 ).toString( 'hex' );
                        const data = message.slice( 12 );
                        const json = JSON.parse( data.toString() );
                        // rx message
                        let rxMsg = [];
                        if( json.rxpk )
                        {
                            for( const item of json.rxpk )
                            {
                                rxMsg.push( {  topic:"rx", gateway:mac, payload:item } );
                                node.status( ++counter );
                            }
                        }
                        // stat message
                        let statMsg = null;
                        if( json.stat )
                        {
                            statMsg = { topic:"stat", gateway:mac, payload:json.stat };
                        }
                        node.send( [rxMsg,statMsg] );
                        // ACK message
                        server.send( Buffer.from([2,message[1],message[2],1]), remote.port, remote.address );
                        break;
                    
                    case 2: // PULL_DATA
                        gateway = { id:   message.slice( 4, 12 ).toString( 'hex' ),
                                    ip:   remote.address,
                                    port: remote.port };
                        // ACK message
                        server.send( Buffer.from([2,message[1],message[2],4]), remote.port, remote.address );
                        break;

                    case 5: // TX_ACK
                        console.log( "message ACK" );
                        break;
    
                    default:
                        node.warn( "invalid message ", message[3] );
                }
            }
            else
            {
                node.warn( "invalid data" );
            }
        });

        // NodeRed Callbacks
        node.on('input',function(msg) {
            // send message
            if( gateway )
            {
                if( ++stamp >= 0xFFFF )
                {
                    stamp = 0;
                }
                server.send( Buffer.concat([Buffer.from([2,stamp>>8,stamp&0xFF,3]),Buffer.from(JSON.stringify(msg.payload))]), gateway.port, gateway.ip );
            }
            else
            {
                node.warn( "yet no gateway known" );
            }
        });

        node.on("close", function(){
            server.close();
        });
    }

    RED.nodes.registerType( "lorawan-server", lorawanserver );
};
