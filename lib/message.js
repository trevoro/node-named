// What does a DNS message look like?
//

var protocol = require('./protocol');
// DNS messages are either requests or responses
//
//


var Message = function() {
  var self = this;

  this._id = undefined;
  this._authoritative = false;
  this._truncated = false;
  this._recursionWanted = true;
  this._recursionAvail = false;
  this._responseCode = 0;
  this._flags = {};
  this._client = undefined;
  this._raw = undefined;
  this._questions = [];
  this._answers = [];

  this.__defineGetter__('id', function() {
    return (self._id);
  });

  this.__defineGetter__('truncated', function() {
    return (self._truncated);
  });
  
  this.__defineGetter__('operation', function() {
    switch (self._flags.opcode) {
      case 0:
        return 'query';
        break;
      case 2:
        return 'status';
        break;
      case 4:
        return 'notify';
        break;
      case 5:
        return 'update';
        break
    }
  });
  
  this.__defineGetter__('recursionWanted', function() {
    return (self._flags.rd);
  });
  
  this.__defineGetter__('recursionAvail', function() {
    return (self._flags.ra);
  });
  
  this.__defineGetter__('authoritative', function() {
    return (self._authoritative);
  });
  
  this.__defineGetter__('client', function() {
    return (self._client);
  });
  
  this.__defineGetter__('responseCode', function() {
    return (self._responseCode);
  });

  this.__defineSetter__('recursionAvail', function(v) {
    if (typeof (v) !== 'boolean') {
      throw new TypeError('recursionAvail must be boolean');
    }
    self._flags.ra = v;
  });

}

Message.prototype.encode = function() {
  
  var header = protocol.packHeader(response.header);
  var question = protocol.packQuestion(response.questions[0]); // XXX
  var answer;

  // we only get answers on non-error packets
  if (response.header.flags.rcode == 0) {
    answer = protocool.packAnswer(response.answer);
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

Message.parse = function(raw, client) {

  this._raw = raw;
  this._client = client;

  var msg = raw.buf;
  var pos;

  this._id     = msg.readUInt16BE(0);
  var flags = msg.readUInt16BE(2);
  
  this._flags = {
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

  var qdCount = msg.readUInt16BE(4);  // # questions
  var anCount = msg.readUInt16BE(6);  // # answers
  var nsCount = msg.readUInt16BE(8);  // # nameservers
  var adCount = msg.readUInt16BE(10); // # additional

  // XXX qdcount tells us how many questions there are
  // need to use that and not assume one question

  pos = 12;

  for ( var i=0; i<qdCount; i++ ) {
    var q = { name: [], type: null, qclass: null };
    var llen = b.readUInt8(pos);
    
    while (llen != 0x00) {
      pos++;
      var t = b.slice(pos, pos + llen);
      q.name.push(t.toString());
      pos = pos + llen;  
      llen = b.readUInt8(pos);
    }

    q.type = b.readUInt16BE(pos + 1);
    q.qclass = b.readUInt16BE(pos + 3);
    pos = pos + 2;
    
    this._questions.push(q);
  }

  return true;
}
