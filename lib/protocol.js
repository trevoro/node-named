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

/** the internet */
var QCLASS_IN = 0x01,
    /** obsolete */
    QCLASS_CS = 0x02,
    /** chaos class. yes this actually exists */
    QCLASS_CH = 0x03,
    /** Hesiod */
    QCLASS_HS = 0x04,
    /** No error */
    DNS_ENOERR = 0x00,
    /** Formatting Error */
    DNS_EFORMAT = 0x01,
    /** server it unable to process */
    DNS_ESERVER = 0x02,
    /** name does not exist */
    DNS_ENONAME = 0x03,
    /** feature not implemented on this server */
    DNS_ENOTIMP = 0x04,
    /** refused for policy reasons */
    DNS_EREFUSE = 0x05;

var Formats = {
    answer: {
        name: { type: '_nsName' },
        rtype: { type: 'UInt16BE' },
        rclass: { type: 'UInt16BE' },
        rttl: { type: 'UInt32BE' },
        rdata: { type: '_nsData' }     // rdlength is prepended to this field
    },

    question: {
        name: { type: '_nsName' },
        type: { type: 'UInt16BE' },
        qclass: { type: 'UInt16BE' }
    },

    header: {
        id: { type: 'UInt16BE' },
        flags: { type: '_nsFlags' },
        qdCount: { type: 'UInt16BE' },
        anCount: { type: 'UInt16BE' },
        nsCount: { type: 'UInt16BE' },
        srCount: { type: 'UInt16BE' }
    },

    soa: {
        host: { type: '_nsName' },
        admin: { type: '_nsName' },
        serial: { type: 'UInt32BE' },
        refresh: { type: 'UInt32BE' },
        retry: { type: 'UInt32BE' },
        expire: { type: 'UInt32BE' },
        ttl: { type: 'UInt32BE' }
    },

    mx: {
        priority: { type: 'UInt16BE' },
        exchange: { type: '_nsName' }
    },

    txt: {
        text: { type: '_nsText' }
    },

    srv: {
        priority: { type: 'UInt16BE' },
        weight: { type: 'UInt16BE' },
        port: { type: 'UInt16BE' },
        target: { type: '_nsName' }
    },

    queryMessage: {
        header: { type: { format: 'header' } },
        question: { type: { format: 'question' } }
    },

    answerMessage: {
        header: { type: { format: 'header' } },
        question: { type: { format: 'question' } },
        answers: { type: '_nsAnswers' }
    }
};

/**
 * turns a dotted-decimal address into a UInt32
 * @param {string} addr
 */
function parseIPv4(addr) {
    if (typeof (addr) !== 'string')
        throw new TypeError('addr (string) is required');

    var octets = addr.split(/\./).map((octet) => {
        return (parseInt(octet, 10));
    });
    if (octets.length !== 4)
        throw new TypeError('valid IP address required');

    var uint32 = ((octets[0] * Math.pow(256, 3)) +
        (octets[1] * Math.pow(256, 2)) +
        (octets[2] * 256) + octets[3]);

    return (uint32);
}

/**
 * turns a double-dotted-decimal address into a UInt32
 * @param {string} addr
 */
function parseIPv6(addr) {
    if (typeof (addr) !== 'string')
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
// and must return the serialized value as a buffer
var serializers = {
    UInt32BE: {
        encoder: (v) => {
            var b = new Buffer(4);
            b.writeUInt32BE(v, 0);
            return b;
        },

        decoder: (v, p) => {
            return v.readUInt32BE(v, p);
        }
    },
    UInt16BE: {
        encoder: (v) => {
            var b = new Buffer(2);
            b.writeUInt16BE(v, 0);
            return b;
        },

        decoder: (v, p) => {
            var res = v.readUInt16BE(p);
            return { val: res, len: 2 };
        }
    },
    _nsAnswers: {
        encoder: (v) => {
            var s = 0,
                p = 0,
                answers = [];
            for (i in v) {
                var r = encode(v[i], 'answer');
                answers.push(r);
                s = s + r.length;
            }

            var b = new Buffer(s);
            for (n in answers) {
                answers[n].copy(b, p);
                p = p + answers[n].length;
            }
            return b;
        }
    },
    _nsFlags: {
        encoder: (v) => {
            if (typeof (v) !== 'object') 
                throw new TypeError("flag must be an object");
            
            var b = new Buffer(2);
            var f = 0x0000;
            f = f | (v.qr << 15);
            f = f | (v.opcode << 11);
            f = f | (v.aa << 10);
            f = f | (v.tc << 9);
            f = f | (v.rd << 8);
            f = f | (v.ra << 7);
            f = f | (v.z << 6);
            f = f | (v.ad << 5);
            f = f | (v.cd << 4);
            f = f | v.rcode;
            b.writeUInt16BE(f, 0);
            return b;
        },

        decoder: (v, p) => {
            var flags = v.readUInt16BE(p);
            var f = {
                qr: ((flags & 0x8000)) ? true : false,
                opcode: ((flags & 0x7800)),
                aa: ((flags & 0x0400)) ? true : false,
                tc: ((flags & 0x0200)) ? true : false,
                rd: ((flags & 0x0100)) ? true : false,
                ra: ((flags & 0x0080)) ? true : false,
                z: ((flags & 0x0040)) ? true : false,
                ad: ((flags & 0x0020)) ? true : false,
                cd: ((flags & 0x0010)) ? true : false,
                rcode: ((flags & 0x000F))
            };
            return { val: f, len: 2 };
        }
    },
    _nsIP4: {
        encoder: (v) => {
            var a = parseIPv4(v),
                b = new Buffer(4);
            b.writeUInt32BE(a, 0);
            return b;
        }
    },
    _nsIP6: {
        encoder: (v) => {
            var a = parseIPv6(v),
                b = new Buffer(16);
            for (var i = 0; i < 8; i++) {
                b.writeUInt16BE(a[i], i * 2);
            }
            return b;
        }
    },
    _nsName: {
        encoder: (v) => {
            if (typeof (v) !== 'string')
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

        decoder: (v, p) => {
            var start = p,
                name = [],
                rlen = v.readUInt8(p);
            while (rlen != 0x00) {
                name.push(v.slice(p, p + rlen).toString());
                p = (p + 1) + rlen;
                rlen = v.readUInt8(p);
            }

            return {
                val: name.join('.'),
                len: (p - start + 1)
            };
        }
    },
    _nsText: {
        encoder: (v) => {
            var b = new Buffer(v.length + 1);
            b.writeUInt8(v.length, 0);
            b.write(v, 1);
            return b;
        }
    },
    _nsData: {
        encoder: (v, t) => {
            var r;
            // TODO with the new queryTypes layout this could probably be mostly
            // eliminated

            switch (t) {
                case queryTypes['A']:
                    r = serializers['_nsIP4'].encoder(v.target);
                    break;
                case queryTypes['CNAME']:
                    r = serializers['_nsName'].encoder(v.target);
                    break;
                case queryTypes['NS']:
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

            var l = r.length;
            var b = new Buffer(l + 2);
            b.writeUInt16BE(l, 0);
            r.copy(b, 2);
            return b;
        }
    },
};

/**
 * Encode Something
 * @param {object} obj
 * @param {any} format
 */
function encode(obj, format) {
    var size = 0,
        pos = 0,
        fmt = Formats[format],
        result,
        results = [];

    for (f in fmt) {
        var type = fmt[f].type,
            res;

        if (typeof (type) === 'string') {
            //XXX I dont like this
            if (type == '_nsData') 
                res = serializers['_nsData'].encoder(obj[f], obj['rtype']);
            else res = serializers[type].encoder(obj[f]);
        } else if (typeof (type) === 'object') {
            reftype = type.format;
            res = encode(obj[f], reftype);
        } else
            throw new TypeError('invalid type');

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

/**
 * Decode Something
 * @param {any} raw
 * @param {any} format
 * @param {number} pos
 */
function decode(raw, format, pos) {
    var size = 0,
        fmt = Formats[format],
        result = {};
    if (!pos) pos = 0;

    for (var f in fmt) {
        var type = fmt[f].type,
            res;

        // if the type is a string its a reference to a serializer
        // if the type is an object its a nested format and we call decode again
        // with the appropriate offset

        if (typeof (type) === 'string') {
            res = serializers[type].decoder(raw, pos);
        } else if (typeof (type) === 'object') {
            res = decode(raw, type.format, pos);
        } else
            throw new TypeError('invalid type');

        pos += res.len;
        result[f] = res.val;
    }

    return {
        val: result,
        len: pos
    };
}

var queryTypes = {
    /** ipv4 address */
    A: 0x01,
    /** nameserver */
    NS: 0x02,
    /** obsolete */
    MD: 0x03,
    /** obsolete */
    MF: 0x04,
    /** alias */
    CNAME: 0x05,
    /** start of authority */
    SOA: 0x06,
    /** experimental */
    MB: 0x07,
    /** experimental */
    MG: 0x08,
    /** experimental */
    MR: 0x09,
    /** experimental null RR */
    NULL: 0x0A,
    /** service description */
    WKS: 0x0B,
    /** reverse entry (inaddr.arpa) */
    PTR: 0x0C,
    /** host information */
    HINFO: 0x0D,
    /** mailbox or mail list information */
    MINFO: 0x0E,
    /** mail exchange */
    MX: 0x0F,
    /** text strings */
    TXT: 0x10,
    /** ipv6 address */
    AAAA: 0x1C,
    /** srv records */
    SRV: 0x21,
    /** request to transfer entire zone */
    AXFR: 0xFC,
    /** request for mailbox related records */
    MAILA: 0xFE,
    /** request for mail agent RRs */
    MAILB: 0xFD,
    /** any class */
    ANY: 0xFF,
    /** ipv4 address */
    0x01: 'A',
    /** nameserver */
    0x02: 'NS',
    /** obsolete */
    0x03: 'MD',
    /** obsolete */
    0x04: 'MF',
    /** alias */
    0x05: 'CNAME',
    /** start of authority */
    0x06: 'SOA',
    /** experimental */
    0x07: 'MB',
    /** experimental */
    0x08: 'MG',
    /** experimental */
    0x09: 'MR',
    /** experimental null RR */
    0x0A: 'NULL',
    /** service description */
    0x0B: 'WKS',
    /** reverse entry (inaddr.arpa) */
    0x0C: 'PTR',
    /** host information */
    0x0D: 'HINFO',
    /** mailbox or mail list information */
    0x0E: 'MINFO',
    /** mail exchange */
    0x0F: 'MX',
    /** text strings */
    0x10: 'TXT',
    /** ipv6 address */
    0x1C: 'AAAA',
    /** srv records */
    0x21: 'SRV',
    /** request to transfer entire zone */
    0xFC: 'AXFR',
    /** request for mailbox related records */
    0xFE: 'MAILA',
    /** request for mail agent RRs */
    0xFD: 'MAILB',
    /** any class */
    0xFF: 'ANY',
}

module.exports = {
    /** No error */
    DNS_ENOERR: 0x00,
    /** Formatting Error */
    DNS_EFORMAT: 0x01,
    /** server it unable to process */
    DNS_ESERVER: 0x02,
    /** name does not exist */
    DNS_ENONAME: 0x03,
    /** feature not implemented on this server */
    DNS_ENOTIMP: 0x04,
    /** refused for policy reasons */
    DNS_EREFUSE: 0x05,
    encode: encode,
    decode: decode,
    queryTypes: queryTypes
}