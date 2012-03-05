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
 
      0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
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

      0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    /                     QNAME                     /
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                     QTYPE                     |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                     QCLASS                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+


    Resource Record:

      0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    /                      NAME                     /
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
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

--md-- */

var types = require('./types');
var db = require('./db');

db.load();

var parse = function(raw, client) {

  var msg = raw.buf;
  var size = raw.size;

  var getQuestion = function(b, p) {
    var q = { name: [], type: null, qclass: null };
    var llen = b.readUInt8(p);
    
    while (llen != 0x00) {
      p++;
      var t = b.slice(p, p + llen);
      q.name.push(t.toString());
      p = p + llen;  
      llen = b.readUInt8(p);
    }

    q.type = b.readUInt16BE(p + 1);
    q.qclass = b.readUInt16BE(p + 3);
    
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
      id:     msg.readUInt16BE(0),
      flags:  getFlags(msg.readUInt16BE(2)),
      qdcount: msg.readUInt16BE(4),
      ancount: msg.readUInt16BE(6),
      nscount: msg.readUInt16BE(8),
      srcount: msg.readUInt16BE(10) 
    },
    questions: [],
    answer: {},
    authority: {}
  };
  
  // XXX qdcount tells us how many questions there are
  // need to use that and not assume one question
  for ( var i=0; i<query.header.qdcount; i++ ) {
    query.questions.push(getQuestion(msg, 12));
  }
  
  return query;
}

var encode = function(response, callback) {
  // Compressed Name (variable)
  var packName = function(name) {
    var b = new Buffer(name.toString().length + 2); 
    var o = 0;

    for (var i = 0; i < name.length; i++) {
      var l = name[i].length;
      b[o] = l;
      b.write(name[i], ++o, l, 'utf8');
      o += l;
    }
    b[o] = 0x00;

    return b;
  }

  // IP4addr - (4 bytes)
  var packIP = function(ipaddr) {
    var t = ipaddr.split(/\./);
    var b = new Buffer(4);
    var d = (t[0] << 24 | t[1] << 16 | t[2] << 8 | t[3])
    b.writeUInt32BE(d, 0);

    return b;
  }

  // Flags (uint16be)
  var packFlags = function(flags) {
    var f = 0x0000;
   
    f = f | (flags.qr << 15);
    f = f | (flags.opcode << 11);
    f = f | (flags.aa << 10);
    f = f | (flags.tc << 9);
    f = f | (flags.rd << 8);
    f = f | (flags.ra << 7);
    f = f | (flags.z  << 6);
    f = f | (flags.ad << 5);
    f = f | (flags.cd << 4);
    f = f | flags.rcode;
    
    return f;
  }
  
  // Header (12 bytes)
  var packHeader = function(header) {
    var h = new Buffer(12);
    h.writeUInt16BE(header.id, 0);
    h.writeUInt16BE(packFlags(header.flags), 2);
    h.writeUInt16BE(header.qdcount, 4);
    h.writeUInt16BE(header.ancount, 6);
    h.writeUInt16BE(header.nscount, 8);
    h.writeUInt16BE(header.srcount, 10);

    return h;
  }
  
  // Question (variable)
  var packQuestion = function(question) {
    var pn = packName(question.name);
    var q = new Buffer( 4 + pn.length );
    pn.copy(q);
    q.writeUInt16BE(question.type, pn.length);
    q.writeUInt16BE(question.qclass, pn.length + 2);

    return q;
  }
 
  // Answer (variable)
  var packAnswer = function(record) {
    var n = packName(record.queryName);
    var d = packIP(record.responseData)
    var a = new Buffer(10 + n.length + d.length);
  
    n.copy(a);
    a.writeUInt16BE(record.responseType, n.length);
    a.writeUInt16BE(record.queryClass, n.length + 2);
    a.writeUInt32BE(record.responseTTL, n.length + 4);
    a.writeUInt16BE(d.length, n.length + 8);
    d.copy(a, n.length + 10);

    return a;
  }
   
  var header = packHeader(response.header);
  var question = packQuestion(response.questions[0]); // XXX
  var answer;

  // we only get answers on non-error packets
  if (response.header.flags.rcode == 0) {
    answer = packAnswer(response.answer);
  } 
  else {
    answer = new Buffer(0);
  }

  var responseSize = header.length + question.length + answer.length;
  var responseBuffer = new Buffer(responseSize);
  
  header.copy(responseBuffer);
  question.copy(responseBuffer, header.length);
  
  if (answer.length > 0) {
    answer.copy(responseBuffer, header.length + question.length);
  }

  return responseBuffer;
}
 
var buildResponse = function(query, callback) {

  var res = query;

  name = query.questions[0].name.map(function(x) { return x; });
  type = query.questions[0].type;

  db.query(name, type, function(error, results) {
 
    // if there was an error looking up the record, then take appropriate
    // action and send a response to the client if necessary
    if (error) {
      res.header.flags.qr = true;
      res.header.flags.aa = false;
      res.header.flags.tc = false;
      res.header.flags.ra = false;
      res.header.flags.rcode = error;
      res.header.ancount = 0;
      res.header.nscount = 0;
      res.header.srcount = 0;

      return callback(null, encode(res));
    }

    /* 

    isAuthoritative: true,
    isQuery: true,
    hasRecursion: false,
    recursionReq: true,
    recursionRes: false,
    errorCode:
    answer: []
    additional: []

    */
   
    var answer= {
      queryName: name,
      queryClass: QCLASS_IN,
      responseTTL: results[0][2],
      responseType: results[0][0],
      responseData: results[0][1], 
    };
    
    res.answer = answer;
 
    //res.header.flags.opcode = 0; // probably doesnt need to get modified
    //res.header.flags.qd = true;
    
    res.header.flags.qr = true;
    res.header.flags.aa = false; 
    res.header.flags.tc = false; // true if buffer - encap > 512 bytes
    res.header.flags.ra = false; // recursion not supported
    res.header.flags.rcode = 0;
    
    res.header.ancount = 1; // TODO
    res.header.nscount = 0; // TODO
    res.header.srcount = 0; // TODO

    callback(null, encode(res));
  });

}

module.exports = {
  parse: parse,
  encode: encode,
  buildResponse: buildResponse
}
