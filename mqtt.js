function parseCSKVpairs(cskvpairs, key) {

    var keys = '';
    keys += cskvpairs;
    if ( keys.length ) {
        var kvpairs = keys.split(',');
        for ( var i = 0; i < kvpairs.length; i++ ) {
            var kvpair = kvpairs[i].split('=');
            if ( kvpair[0].toUpperCase() == key ) {
                return kvpair[1];
            }
        }
    }
    return ""; // Default condition
}

var client_messages = 1;
var client_id_str = "-";


function getClientId(s) {

    var payload = '';

    s.on('upload', function(data, flags) {
        if( data.length == 0 ) {
            // Do nothing. s.AGAIN seems to have been replaced with nothing. Doing nothing here works.
            return;
        }
        else if( client_messages == 1 ) {
            payload += data;
            // CONNECT packet is 1, using upper 4 bits (00010000 to 00011111)
            var packet_type_flags_byte =  payload.charCodeAt(0);   //data.charCodeAt(0);
            //s.log("MQTT packet type+flags = " + packet_type_flags_byte.toString());
            if ( packet_type_flags_byte >= 16 && packet_type_flags_byte < 32 ) {
                // Calculate remaining length with variable encoding scheme
                var multiplier = 1;
                var remaining_len_val = 0;
                var remaining_len_byte;
                for (var remaining_len_pos = 1; remaining_len_pos < 5; remaining_len_pos++ ) {
                    remaining_len_byte = payload.charCodeAt(remaining_len_pos);
                    if ( remaining_len_byte == 0 ) break; // Stop decoding on 0
                    remaining_len_val += (remaining_len_byte & 127) * multiplier;
                    multiplier *= 128;
                }

                // Extract ClientId based on length defined by 2-byte encoding
                var payload_offset = remaining_len_pos + 10; // Skip fixed header
                var client_id_len_msb = payload.charCodeAt(payload_offset);
                var client_id_len_lsb = payload.charCodeAt(payload_offset + 1);
                //s.log("MSB: " + client_id_len_msb + "LSB: " + client_id_len_lsb)
                if ( client_id_len_lsb.length < 2 ) client_id_len_lsb = "0" + client_id_len_lsb;
                var client_id_len_int = client_id_len_msb + client_id_len_lsb;
                //s.log("ID Lenght: " + client_id_len_int)
                
                client_id_str = payload.substr(payload_offset + 2, client_id_len_int);
                s.log("ClientId value  = " + client_id_str);
                
                // If client authentication then check certificate CN matches ClientId
                //s.log("SSL Payload: " + s.variables.ssl_client_s_dn)
                var client_cert_cn = parseCSKVpairs(s.variables.ssl_client_s_dn, "CN");
                if ( client_cert_cn.length && client_cert_cn != client_id_str ) {
                    s.log("Client certificate common name (" + client_cert_cn + ") does not match client ID");
                    return s.ERROR; // Close the TCP connection (logged as 500)
                }
            } else {
                s.log("Received unexpected MQTT packet type+flags: " + packet_type_flags_byte.toString());
            }
        }
        client_messages++;
        s.allow();
    });
}

function setClientId(s) {
    return client_id_str;
}

