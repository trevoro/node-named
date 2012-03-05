// Now we're talking
// Stores protocol privimites. Answers and Questions
// are put together from these primitives.
//
// options are to have a "value" type which just says "
// make sure the answer is already there as a buffer", or make nested
// types even more possible with a "type" indicator on an object as it 
// travels around

var ANSWER = {
  name: { type: '_nsName' },
  rtype: { type: 'UInt16BE' },
  rclass: { type: 'UInt16BE' },
  rttl: { type: 'UInt32BE' },
  rdlength: { type: 'UInt32BE' } //XXX - refers to length of data 
  rdata: { type: '_nsData' },    //XXX - can be multiple nested types
}

var QUESTION = {
  name: { type: '_nsName' },
  type: { type: 'UInt16BE' },
  qclass: { type: 'UInt16BE' }
}

var HEADER = {
  id: { type: 'UInt16BE' },
  flags: { type: '_nsFlags' },
  qdcount: { type: 'UInt16BE' },
  ancount: { type: 'UInt16BE' },
  nscount: { type: 'UInt16BE' },
  srcount: { type: 'UInt16BE' },
}

var SOA = {
  domain: { type: '_nsName' },
  admin: { type: '_nsName' },
  serial: { type: 'UInt32BE' },
  refresh: { type: 'UInt32BE' },
  retry: { type: 'UInt32BE' }, 
  expire: { type: 'UInt32BE' },
  minimum: { type: 'UInt32BE' }
}

var MX = {
  priority: { type: 'UInt16BE' },
  exchange: { type: '_nsName' }
}

var TXT = {
  text: { type: '_nsText' }
}

// http://www.ietf.org/rfc/rfc2782.txt
var SRV = {
  spname: { type: '_nsName' },
  rttl: { type: 'UInt32BE' },
  rclass: { type: 'UInt16BE' },
  priority: { type: 'UInt16BE' },
  weight: { type: 'UInt16BE' },
  port: { type: 'UInt16BE' },
  target: { type: '_nsName' } //XXX - can have multiple entries
}

// each of these type serializers accept a value to serialize
// and must return the serialized value as a buffer
var serializers = {
  'UInt32BE': function(v) {
    var b = new Buffer(4);
    b.writeUInt32BE(v, 0);
    return b;
  },
  'UInt16BE': function(v) {
    var b = new Buffer(2);
    b.writeUInt16BE(v, 0);
    return b;
  },
  '_nsFlags': function(v) {
    if (typeof(v) !== 'object') { 
      throw new TypeError("flag must be an object");
    }
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
    return f;
  },
  '_nsData': function(v) {
    //XXX skip buffers
    console.log(typeof(v));
    return v;
  },
  '_nsIp4': function(v) {
    var b = new Buffer(4);
    var t = v.split(/\./);
    var d = (t[0] << 24 | t[1] << 16 | t[2] << 8 | t[3])
    b.writeUInt32(d, 0);
    return b;
  },
  '_nsName': function(v) {
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
  '_nsText': function(v) {
    return new Buffer(v.toString, 'utf8');
  }
};

var encode = function(obj, sType) {

  var buffers = [];
  var size = 0;
  var position = 0;

  for (k in sType) { 
    var type = sType[k].type;
    //console.log("DEBUG (serializer) %s: %s", k, obj[k]);
    var b = serializers[type](obj[k]);
    buffers.push(b);
    size += b.length;
  }

  var result = new Buffer(size);
  
  for (i in buffers) {
    var buf = buffers[i];
    buf.copy(result, position);
    position += buf.length;
  }

  return result;
}


var soaObj = {
  domain: 'joyent.dev',
  admin: 'admin.joyent.dev',
  serial: 1,
  refresh: 2,
  retry: 3,
  expire: 4,
  minimum: 5
};

var rdata = encode(soaObj, SOA);
var answerTest = {
  name:  'test.joyent.dev',
  rtype: 1,
  rclass: 1,
  rttl: 5,
  rdlength: rdata.length
  rdata: rdata, 
};


console.log(encode(answerTest, ANSWER));
