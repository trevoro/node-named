#!/usr/bin/env node

/* ++md++
 
# TODO:

  * Support better packet compression
  * Recursion
  * Responses
  * AAAA records
 
 
    From RFC1035 & http://www.ietf.org/rfc/rfc2535

    +---------------------+
    |        Header       |
    +---------------------+
    |       Question      | the question for the name server
    +---------------------+
    |        Answer       | RRs answering the question
    +---------------------+
    |      Authority      | RRs pointing toward an authority
    +---------------------+
    |      Additional     | RRs holding additional information
    +---------------------+

    Header:
 
                                    1  1  1  1  1  1
      0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                      ID                       |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |QR|   Opcode  |AA|TC|RD|RA| Z|AD|CD|   RCODE   |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    QDCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    ANCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    NSCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    ARCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

    Question:


                                    1  1  1  1  1  1
      0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                                               |
    /                     QNAME                     /
    /                                               /
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                     QTYPE                     |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                     QCLASS                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+


    Resource Record:

                                    1  1  1  1  1  1
      0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                                               |
    /                                               /
    /                      NAME                     /
    |                                               |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                      TYPE                     |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                     CLASS                     |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                      TTL                      |
    |                                               |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                   RDLENGTH                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--|
    /                     RDATA                     /
    /                                               /
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

--md-- */

var DNS_TYPE = [];
var DNS_RCODE = [];
var DNS_QCLASS = [];

DNS_TYPE[  1] = "A";             // XXX where is AAAA?
DNS_TYPE[  2] = "NS";            // nameserver
DNS_TYPE[  3] = "MD";            // obsolete
DNS_TYPE[  4] = "MF";            // obsolete
DNS_TYPE[  5] = "CNAME";         // alias
DNS_TYPE[  6] = "SOA";           // start of authority
DNS_TYPE[  7] = "MB";            // experimental
DNS_TYPE[  8] = "MG";            // experimental
DNS_TYPE[  9] = "MR";            // experimental
DNS_TYPE[ 10] = "NULL";          // experimental null RR
DNS_TYPE[ 11] = "WKS";           // service description
DNS_TYPE[ 12] = "PTR";  
DNS_TYPE[ 13] = "HFINO";         // host information
DNS_TYPE[ 14] = "MINFO";         // mailbox or mail list information
DNS_TYPE[ 15] = "MX";            // mail exchange
DNS_TYPE[ 16] = "TXT";           // text strings
DNS_TYPE[252] = "AXFR";          // request to transfer entire zone
DNS_TYPE[253] = "MAILB";         // request for mailbox related records
DNS_TYPE[254] = "MAILA";         // request for mail agent RRs
DNS_TYPE[255] = "*";             // any class

DNS_QCLASS[1] = "IN";             // the internet
DNS_QCLASS[2] = "CS";             // obsolete
DNS_QCLASS[3] = "CH";             // chaos class. yes this actually exists
DNS_QCLASS[4] = "HS";             // Hesiod

DNS_RCODE[0] = "No Error";        //
DNS_RCODE[1] = "Format Error";    // unable to interpret query
DNS_RCODE[2] = "Server Failure";  // server itself unable to process
DNS_RCODE[3] = "Name Error";      // name does not exist
DNS_RCODE[4] = "Not Implemented"; // feature not implemented by server
DNS_RCODE[5] = "Refused";         // refused for policy reasons


var util = require('util');
var dgram = require('dgram');


// config
var host = 'localhost';
var port = 9999;
var TTL=5


parseQuery = function(req) {
  
  var getQuestion = function(b, p) {
    var q = { name: [], type: null, class: null };
    var llen = b.readUInt8(p);
    
    while (llen != 0x00) {
      p++;
      var t = b.slice(p, p + llen);
      q.name.push(t.toString());
      p = p + llen;  
      llen = b.readUInt8(p);
    }

    q.type = b.readUInt16BE(p + 1);
    q.class = b.readUInt16BE(p + 3);
    
    return q;
  }

  var getFlags = function(flags) {
    // 16 bit flag field
    var result = {
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
    }
    return (result);
  }
  
  var query = {
    header: { 
      id:     req.readUInt16BE(0),
      flags:  getFlags(req.readUInt16BE(2)),
      qdcount: req.readUInt16BE(4),
      ancount: req.readUInt16BE(6),
      nscount: req.readUInt16BE(8),
      srcount: req.readUInt16BE(10) 
    },
    questions: [],
    answer: {
      aname: null,
      atype: null,
      aclass: null,
      ttl: 5,
      rdlength: null,
      rdata: null
    },
    authority: {
    }
  };
  
  // XXX qdcount tells us how many questions there are
  // need to use that and not assume one question
  for ( var i=0; i<query.header.qdcount; i++ ) {
    query.questions.push(getQuestion(req, 12));
  }

  return query;
}

buildResponse = function(query) {
  var r = query; 
  
  var packName = function(name) {
    var t = name.split(/\./);
    var b = new Buffer(name.length + 2);
    var o = 0;

    for (var i = 0; i < t.length; i++) {
      var l = t[i].length;
      b[o] = l;
      b.write(t[i], ++o, l, 'utf8');
      o += l;
    }
    b[o] = 0x00;

    return b;
  }

  var packIP = function(ipaddr) {
    var t = ipaddr.split(/\./);
    var b = new Buffer(4);
    var d = (t[0] << 24 | t[1] << 16 | t[2] << 8 | t[3])
      console.log("packed value: %s", d);
    b.writeUInt32BE(d, 0);
    console.log(b);
    return b;
  }

  var packFlags = function(flags) {
    var f = 0x0000;
    if (flags.qr) f = f & 0x8000;
    f.opcode = flags.opcode & 0x7800;
    if (flags.aa) f = f & 0x0400;
    if (flags.tc) f = f & 0x0200;
    if (flags.rd) f = f & 0x0100;
    if (flags.ra) f = f & 0x0080;
    if (flags.z)  f = f & 0x0040;
    if (flags.ad) f = f & 0x0020;
    if (flags.cd) f = f & 0x0010;
    f.rcode = flags.rcode & 0x000F;
    
    return f;

  }

  r.header.flags.qr = true;
  r.header.flags.opcode = false;
  r.header.flags.aa = false; 
  r.header.flags.tc = false; 
  r.header.flags.ra = false;
  r.header.flags.rcode = false;
  
  r.header.ancount = 1; // XXX
  r.header.nscount = 0;
  r.header.srcount = 0;

  r.answer.aname  = query.questions[0].name;
  r.answer.atype  = 0x01; // A record
  r.answer.aclass = 0x01; // IN
  r.answer.ttl    = 5;    // Time to live
  r.answer.rdata = packIP('127.0.1.1');
  r.answer.rdlength = r.answer.rdata.length;

  // Header (12 bytes)
  var h = new Buffer(12);
  h.writeUInt16BE(r.header.id, 0);
  h.writeUInt16BE(packFlags(r.header.flags), 2);
  h.writeUInt16BE(r.header.qdcount, 4);
  h.writeUInt16BE(r.header.ancount, 6);
  h.writeUInt16BE(r.header.nscount, 8);
  h.writeUInt16BE(r.header.srcount, 10);

  // Question (variable length)
  var qn = packName(r.questions[0].name.join('.'));
  var q = new Buffer( 4 + qn.length );
  qn.copy(q);
  q.writeUInt16BE(r.questions[0].type, qn.length);
  q.writeUInt16BE(r.questions[0].class, qn.length + 2);
    
  // Answer (variable length)
  var n = packName(r.answer.aname.join('.')); // XXX 
  var d = packIP('127.0.1.1');
  var a = new Buffer(10 + n.length + d.length);
  n.copy(a);
  a.writeUInt16BE(r.answer.atype, n.length);
  a.writeUInt16BE(r.answer.aclass, n.length + 2);
  a.writeUInt32BE(r.answer.ttl, n.length + 4);
  a.writeUInt16BE(d.length, n.length + 8);
  d.copy(a, n.length + 10);
  
  var response = new Buffer( h.length + q.length + a.length );
  h.copy(response);
  q.copy(response, h.length);
  a.copy(response, h.length + q.length);

  return response;

}

var server = dgram.createSocket('udp4');

var onSend = function(error, sent) {
  console.log("%s bytes sent", sent);
}

server.on('message', function(msg, client) {
  var query = parseQuery(msg);
  console.log("got query: %s", query.questions[0].name.join('.'));
  console.log(query);
  var buf = buildResponse(query);
  server.send(buf, 0, buf.length, client.port, client.address, onSend);
});

server.bind(port, host);
console.log("dns server started on " + host + ":" + port);
