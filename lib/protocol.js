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


*/
	
QTYPE_A     = 0x01, // ipv4 address
QTYPE_NS    = 0x02, // nameserver
QTYPE_MD    = 0x03, // obsolete
QTYPE_MF    = 0x04, // obsolete
QTYPE_CNAME = 0x05, // alias
QTYPE_SOA   = 0x06, // start of authority
QTYPE_MB    = 0x07, // experimental
QTYPE_MG    = 0x08, // experimental
QTYPE_MR    = 0x09, // experimental
QTYPE_NULL  = 0x0A, // experimental null RR
QTYPE_WKS   = 0x0B, // service description
QTYPE_PTR   = 0x0C, // reverse entry (inaddr.arpa)
QTYPE_HINFO = 0x0D, // host information
QTYPE_MINFO = 0x0E, // mailbox or mail list information
QTYPE_MX    = 0x0F, // mail exchange
QTYPE_TXT   = 0x10, // text strings
QTYPE_AAAA  = 0x1C, // ipv6 address
QTYPE_AXFR  = 0xFC, // request to transfer entire zone
QTYPE_MAILA = 0xFE, // request for mailbox related records
QTYPE_MAILB = 0xFD, // request for mail agent RRs
QTYPE_ANY   = 0xFF, // any class
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
	domain: { type: '_nsName' },
	admin: { type: '_nsName' },
	serial: { type: 'UInt32BE' },
	refresh: { type: 'UInt32BE' },
	retry: { type: 'UInt32BE' }, 
	expire: { type: 'UInt32BE' },
	minimum: { type: 'UInt32BE' }
};

Formats.mx = {
	priority: { type: 'UInt16BE' },
	exchange: { type: '_nsName' }
};

Formats.txt = {
	text: { type: '_nsText' }
};

Formats.srv = {
	spname: { type: '_nsName' },
	rttl: { type: 'UInt32BE' },
	rclass: { type: 'UInt16BE' },
	priority: { type: 'UInt16BE' },
	weight: { type: 'UInt16BE' },
	port: { type: 'UInt16BE' },
	target: { type: '_nsName' } //XXX - can have multiple entries
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
      	p = p + b.length;
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
			var t, b, d;
      b = new Buffer(4);
      t = v.split(/\./);
			d = (t[0] << 24 | t[1] << 16 | t[2] << 8 | t[3])
			b.writeUInt16BE(d, 0);
			return b;
		}
  },
  '_nsName': {
		encoder: function(v) {
			var b = new Buffer(v.toString().length + 2); 
			var o = 0; //offset

			for (var i = 0; i < v.length; i++) {
				var l = v[i].length;
				b[o] = l;
				b.write(v[i], ++o, l, 'utf8');
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

			return { val: name, len: (p - start + 1) };
	  }
  },
  '_nsText': {
		encoder: function(v) {
			return new Buffer(v.toString, 'utf8');
		}
	},
	'_nsData': {
		encoder: function(v, t) {
			var r, b, l;
			//data is a buffer with a UInt16BE prepended, indicating size of the data
		  switch(t) {
				case QTYPE_A:
					r = serializers['_nsIP4'].encoder(v);
					break;
				case QTYPE_CNAME:
				  r = serializers['_nsName'].encoder(v);
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

var encode = function(obj, format) {
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

var decode = function(raw, format, pos) {
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


module.exports = {
	QTYPE_A     : 0x01, // ipv4 address
	QTYPE_NS    : 0x02, // nameserver
	QTYPE_MD    : 0x03, // obsolete
	QTYPE_MF    : 0x04, // obsolete
	QTYPE_CNAME : 0x05, // alias
	QTYPE_SOA   : 0x06, // start of authority
	QTYPE_MB    : 0x07, // experimental
	QTYPE_MG    : 0x08, // experimental
	QTYPE_MR    : 0x09, // experimental
	QTYPE_NULL  : 0x0A, // experimental null RR
	QTYPE_WKS   : 0x0B, // service description
	QTYPE_PTR   : 0x0C, // reverse entry (inaddr.arpa)
	QTYPE_HINFO : 0x0D, // host information
	QTYPE_MINFO : 0x0E, // mailbox or mail list information
	QTYPE_MX    : 0x0F, // mail exchange
	QTYPE_TXT   : 0x10, // text strings
	QTYPE_AAAA  : 0x1C, // ipv6 address
	QTYPE_AXFR  : 0xFC, // request to transfer entire zone
	QTYPE_MAILA : 0xFE, // request for mailbox related records
	QTYPE_MAILB : 0xFD, // request for mail agent RRs
	QTYPE_ANY   : 0xFF, // any class
	QCLASS_IN   : 0x01, // the internet
	QCLASS_CS   : 0x02, // obsolete
	QCLASS_CH   : 0x03, // chaos class. yes this actually exists
	QCLASS_HS   : 0x04, // Hesiod
	DNS_ENOERR  : 0x00, // No error
	DNS_EFORMAT : 0x01, // Formatting Error
	DNS_ESERVER : 0x02, // server it unable to process
	DNS_ENONAME : 0x03, // name does not exist
	DNS_ENOTIMP : 0x04, // feature not implemented on this server
	DNS_EREFUSE : 0x05, // refused for policy reasons
	encode: encode,
	decode: decode
}
