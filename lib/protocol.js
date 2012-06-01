/*

  # Protocol

  Stores protocol definitions and their primitives as well as any other
  associated protocol constants

  ## References

  http://tools.ietf.org/html/rfc1035
  http://tools.ietf.org/html/rfc4408
  http://tools.ietf.org/html/rfc2782
  http://tools.ietf.org/html/rfc3596

  ## Notes

  * Even though RFC1035 says that questions should support multiple queries, the
  reality is *nobody* does this. MS DNS doesn't support it and apparently BIND
  doesn't support it as well. That implies no client side tools do either - so
  we will not worry about that complication.

  * DNS Extensions have been proposed, but another case of chicken-and-egg.
  These extensions make it _possible_ to have DNS queries over 512 bytes in
  length, but because it is not universally supported, nobody does it.

*/


var ipaddr = require('ipaddr.js');

QCLASS_IN   = 0x01, // the internet
QCLASS_CS   = 0x02, // obsolete
QCLASS_CH   = 0x03, // chaos class. yes this actually exists
QCLASS_HS   = 0x04, // Hesiod
DNS_ENOERR  = 0x00, // No error
DNS_EFORMAT = 0x01, // Formatting Error
DNS_ESERVER = 0x02, // server it unable to process
DNS_ENONAME = 0x03, // name does not exist
DNS_ENOTIMP = 0x04, // feature not implemented on this server
DNS_EREFUSE = 0x05, // refused for policy reasons

Formats = {};

Formats.answer = {
        name: { type: '_nsName' },
        rtype: { type: 'UInt16BE' },
        rclass: { type: 'UInt16BE' },
        rttl: { type: 'UInt32BE' },
        rdata: { type: '_nsData' },     // rdlength is prepended to this field
};

Formats.question = {
        name: { type: '_nsName' },
        type: { type: 'UInt16BE' },
        qclass: { type: 'UInt16BE' }
};

Formats.header = {
        id: { type: 'UInt16BE' },
        flags: { type: '_nsFlags' },
        qdCount: { type: 'UInt16BE' },
        anCount: { type: 'UInt16BE' },
        nsCount: { type: 'UInt16BE' },
        srCount: { type: 'UInt16BE' },
};

Formats.soa = {
        host: { type: '_nsName' },
        admin: { type: '_nsName' },
        serial: { type: 'UInt32BE' },
        refresh: { type: 'UInt32BE' },
        retry: { type: 'UInt32BE' },
        expire: { type: 'UInt32BE' },
        ttl: { type: 'UInt32BE' }
};

Formats.mx = {
        priority: { type: 'UInt16BE' },
        exchange: { type: '_nsName' }
};

Formats.txt = {
        text: { type: '_nsText' }
};

Formats.srv = {
        priority: { type: 'UInt16BE' },
        weight: { type: 'UInt16BE' },
        port: { type: 'UInt16BE' },
        target: { type: '_nsName' }
};

Formats.queryMessage = {
        header: { type: { format: 'header' } },
        question: { type: { format: 'question' } }
};

Formats.answerMessage = {
        header: { type: { format: 'header' } },
        question: { type: { format: 'question' } },
        answers: { type: '_nsAnswers' }
};


// turns a dotted-decimal address into a UInt32
function parseIPv4(addr) {
        if (typeof(addr) !== 'string')
                throw new TypeError('addr (string) is required');

        var octets = addr.split(/\./).map(function (octet) {
                return (parseInt(octet, 10));
        });
        if (octets.length !== 4)
                throw new TypeError('valid IP address required');

        var uint32 = ((octets[0] * Math.pow(256, 3)) +
                      (octets[1] * Math.pow(256, 2)) +
                      (octets[2] * 256) + octets[3]);
        return (uint32);
}


function parseIPv6(addr) {
        if (typeof(addr) !== 'string')
                throw new TypeError('addr (string) is required');

        var addr;
        try {
                addr = ipaddr.parse(addr);
        } catch (e) {
                return false;
        }

        return addr.parts;

}


// each of these serializers are functions which accept a value to serialize
// and must returns the serialized value as a buffer
var serializers = {
        'UInt32BE': {
                encoder: function(v) {
                        var b = new Buffer(4);
                        b.writeUInt32BE(v, 0);
                        return b;
                },
                decoder: function(v, p) {
                        return v.readUInt32BE(v, p);
                }
        },
        'UInt16BE': {
                encoder: function(v) {
                        var b = new Buffer(2);
                        b.writeUInt16BE(v, 0);
                        return b;
                },
                decoder: function(v, p) {
                        var res = v.readUInt16BE(p);
                        return { val: res, len: 2 };
                }
        },
        '_nsAnswers': {
                encoder: function(v) {
                        var s = 0, p = 0, answers = [];
                        for (i in v) {
                                var r = encode(v[i], 'answer');
                                answers.push(r);
                                s = s + r.length;
                        }
                        b = new Buffer(s);
                        for (n in answers) {
                                answers[n].copy(b, p);
                                p = p + answers[n].length;
                        }
                        return b;
                }
        },
        '_nsFlags': {
                encoder: function(v) {
                        if (typeof(v) !== 'object') {
                                throw new TypeError("flag must be an object");
                        }
                        var b = new Buffer(2);
                        var f = 0x0000;
                        f = f | (v.qr << 15);
                        f = f | (v.opcode << 11);
                        f = f | (v.aa << 10);
                        f = f | (v.tc << 9);
                        f = f | (v.rd << 8);
                        f = f | (v.ra << 7);
                        f = f | (v.z  << 6);
                        f = f | (v.ad << 5);
                        f = f | (v.cd << 4);
                        f = f | v.rcode;
                        b.writeUInt16BE(f, 0);
                        return b;
                },
                decoder: function(v, p) {
                        var flags, f;
                        flags = v.readUInt16BE(p);
                        f = {
                                qr:     (( flags & 0x8000 )) ? true : false,
                                opcode: (( flags & 0x7800 )),
                                aa:     (( flags & 0x0400 )) ? true : false,
                                tc:     (( flags & 0x0200 )) ? true : false,
                                rd:     (( flags & 0x0100 )) ? true : false,
                                ra:     (( flags & 0x0080 )) ? true : false,
                                z:      (( flags & 0x0040 )) ? true : false,
                                ad:     (( flags & 0x0020 )) ? true : false,
                                cd:     (( flags & 0x0010 )) ? true : false,
                                rcode:  (( flags & 0x000F ))
                        };
                        return { val: f, len: 2 };
                }
        },
        '_nsIP4': {
                encoder: function(v) {
                        var a, b;
                        a = parseIPv4(v);
                        b = new Buffer(4);
                        b.writeUInt32BE(a, 0);
                        return b;
                }
        },
        '_nsIP6': {
                encoder: function(v) {
                        var a, b, i = 0;
                        a = parseIPv6(v);
                        b = new Buffer(16);
                        for (var i=0; i<8; i++) {
                                b.writeUInt16BE(a[i], i * 2);
                        }
                        return b;
                }
        },
        '_nsName': {
                encoder: function(v) {
                        if (typeof(v) !== 'string')
                                throw new TypeError('name (string) is required')
                        var n = v.split(/\./);

                        var b = new Buffer(n.toString().length + 2);
                        var o = 0; //offset

                        for (var i = 0; i < n.length; i++) {
                                var l = n[i].length;
                                b[o] = l;
                                b.write(n[i], ++o, l, 'utf8');
                                o += l;
                        }
                        b[o] = 0x00;

                        return b;
                },
                decoder: function(v, p) {
                        var rle, start = p, name = [];

                        rlen = v.readUInt8(p);
                        while (rlen != 0x00) {
                                p++;
                                var t = v.slice(p, p + rlen);
                                name.push(t.toString());
                                p = p + rlen;
                                rlen = v.readUInt8(p);
                        }

                        return { val: name.join('.'), len: (p - start + 1) };
                }
        },
        '_nsText': {
                encoder: function(v) {
                        var b;
                        b = new Buffer(v.length + 1);
                        b.writeUInt8(v.length, 0);
                        b.write(v, 1);
                        return b;
                }
        },
        '_nsData': {
                encoder: function(v, t) {
                        var r, b, l;
                        // TODO with the new queryTypes layout this could probably be mostly
                        // eliminated

                        switch(t) {
                        case queryTypes['A']:
                                r = serializers['_nsIP4'].encoder(v.target);
                                break;
                        case queryTypes['CNAME']:
                                r = serializers['_nsName'].encoder(v.target);
                                break;
                        case queryTypes['SOA']:
                                r = encode(v, 'soa');
                                break;
                        case queryTypes['MX']:
                                r = encode(v, 'mx');
                                break;
                        case queryTypes['TXT']:
                                r = serializers['_nsText'].encoder(v.target);
                                break;
                        case queryTypes['AAAA']:
                                r = serializers['_nsIP6'].encoder(v.target);
                                break;
                        case queryTypes['SRV']:
                                r = encode(v, 'srv');
                                break;
                        default:
                                throw new Error('unrecognized nsdata type');
                                break;
                        }

                        l = r.length;
                        b = new Buffer(l + 2);
                        b.writeUInt16BE(l, 0);
                        r.copy(b, 2);
                        return b;
                }
        },
};

function encode(obj, format) {
        var size = 0, pos = 0, fmt, field, type, result, encoder, results = [];

        fmt = Formats[format];

        for (f in fmt) {
                var type, decoder, res;
                type = fmt[f].type;

                if (typeof(type) === 'string') {
                        //XXX I dont like this
                        if (type == '_nsData') {
                                res = serializers['_nsData'].encoder(obj[f], obj['rtype']);
                        }
                        else {
                                res = serializers[type].encoder(obj[f]);
                        }
                }
                else if (typeof(type) === 'object') {
                        reftype = type.format;
                        res = encode(obj[f], reftype);
                }
                else {
                        throw new TypeError('invalid type');
                }

                results.push(res);
                size = size + res.length;

        }

        result = new Buffer(size);

        for (i in results) {
                var buf = results[i];
                buf.copy(result, pos);
                pos = pos + buf.length;
        }

        return result;
}

function decode(raw, format, pos) {
        var size = 0, fmt, field, type, decoder, result = {}

        if (!pos) pos = 0;
        fmt = Formats[format];

        for (var f in fmt) {
                var type, decoder, res;
                type = fmt[f].type;

                // if the type is a string its a reference to a serializer
                // if the type is an object its a nested format and we call decode again
                // with the appropriate offset

                if (typeof(type) === 'string') {
                        res = serializers[type].decoder(raw, pos);
                }
                else if (typeof(type) === 'object') {
                        reftype = type.format;
                        res = decode(raw, reftype, pos);
                }
                else {
                        throw new TypeError('invalid type');
                }

                pos += res.len;
                result[f] = res.val;

        }

        return {val: result, len: pos};
}


var queryTypes = {
        A     : 0x01,   // ipv4 address
        NS    : 0x02,   // nameserver
        MD    : 0x03,   // obsolete
        MF    : 0x04,   // obsolete
        CNAME : 0x05,   // alias
        SOA   : 0x06,   // start of authority
        MB    : 0x07,   // experimental
        MG    : 0x08,   // experimental
        MR    : 0x09,   // experimental
        NULL  : 0x0A,   // experimental null RR
        WKS   : 0x0B,   // service description
        PTR   : 0x0C,   // reverse entry (inaddr.arpa)
        HINFO : 0x0D,   // host information
        MINFO : 0x0E,   // mailbox or mail list information
        MX    : 0x0F,   // mail exchange
        TXT   : 0x10,   // text strings
        AAAA  : 0x1C,   // ipv6 address
        SRV   : 0x21,   // srv records
        AXFR  : 0xFC,   // request to transfer entire zone
        MAILA : 0xFE,   // request for mailbox related records
        MAILB : 0xFD,   // request for mail agent RRs
        ANY   : 0xFF,   // any class
        0x01  : 'A' ,   // ipv4 address
        0x02  : 'NS',   // nameserver
        0x03  : 'MD',   // obsolete
        0x04  : 'MF',   // obsolete
        0x05  : 'CNAME',// alias
        0x06  : 'SOA',  // start of authority
        0x07  : 'MB',   // experimental
        0x08  : 'MG',   // experimental
        0x09  : 'MR',   // experimental
        0x0A  : 'NULL', // experimental null RR
        0x0B  : 'WKS',  // service description
        0x0C  : 'PTR',  // reverse entry (inaddr.arpa)
        0x0D  : 'HINFO',// host information
        0x0E  : 'MINFO',// mailbox or mail list information
        0x0F  : 'MX',   // mail exchange
        0x10  : 'TXT',  // text strings
        0x1C  : 'AAAA', // ipv6 address
        0x21  : 'SRV',  // srv records
        0xFC  : 'AXFR', // request to transfer entire zone
        0xFE  : 'MAILA',// request for mailbox related records
        0xFD  : 'MAILB',// request for mail agent RRs
        0xFF  : 'ANY',  // any class
}

module.exports = {
        DNS_ENOERR  : 0x00, // No error
        DNS_EFORMAT : 0x01, // Formatting Error
        DNS_ESERVER : 0x02, // server it unable to process
        DNS_ENONAME : 0x03, // name does not exist
        DNS_ENOTIMP : 0x04, // feature not implemented on this server
        DNS_EREFUSE : 0x05, // refused for policy reasons
        encode: encode,
        decode: decode,
        queryTypes: queryTypes
}
