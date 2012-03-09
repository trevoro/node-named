var protocol = require('./protocol');

var DnsMessage = function(arg) {
	if (typeof(arg) !== 'object') {
		throw new TypeError('arg (object) is missing');
	}

  var self = this;

  this._id = arg.id;
  this._authoritative = false; //XXX set on response
  this._truncated = false;
  this._recursionAvail = false; //XXX set on response
  this._responseCode = 0;
  this._qdCount = arg.qdCount;
  this._anCount = arg.anCount;
  this._nsCount = arg.nsCount;
  this._srCount = arg.srCount;
  this._flags = arg.flags;
  this._questions = arg.questions;
  this._answers = [];

  this._raw = null;
  this._source = null;

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

  this.__defineGetter__('opCode', function() {
  	return (self._flags.opcode);
  });
  
  this.__defineGetter__('recursionWanted', function() {
    return (self._flags.rd);
  });
  
  this.__defineGetter__('recursionAvail', function() {
    return (self._recursionAvail);
  });
  
  this.__defineGetter__('authoritative', function() {
    return (self._authoritative);
  });
  
  this.__defineGetter__('dst', function() {
    return (self._source);
  });
  
  this.__defineGetter__('responseCode', function() {
    return (self._responseCode);
  });

  this.__defineSetter__('recursionAvail', function(v) {
    self._flags.ra = v;
  });

  this.__defineGetter__('raw', function() {
  	return (self._raw);
  });

}

// /*****************************************
// /*****************************************
// /*****************************************
// /*****************************************
// XXX TODO *********************************
// /*****************************************
// /*****************************************
// /*****************************************
// /*****************************************

DnsMessage.prototype.encode = function() {
  var header, question, answer, rSize, rBuffer;

	var toPack = {
		header: {
			id: this._id,
			flags: this._flags,
			qdCount: this._qdCount,
			anCount: this._anCount,
			nsCount: this._nsCount,
			srCount: this._srCount
		},
		questions: this._questions,
		answer: this._answers,
		authority: this._authority,
		additional: this._additional
	}

	console.log(toPack);

	var encoded = new Buffer(16); //XXX
	
	this._raw = { 
		buf: encoded,
		len: encoded.length
	};

	console.log(this._raw);

}

parseMessage = function (raw, src) {
  var res, b, pos, reqId, flags, qdCount, anCount, nsCount, adCount;
  var questions = [];
 
  b = raw.buf;
  pos;

  reqId = b.readUInt16BE(0);
  flagI = b.readUInt16BE(2);
  
  flags = {
    qr:     (( flagI & 0x8000 )) ? true : false,
    opcode: (( flagI & 0x7800 )),
    aa:     (( flagI & 0x0400 )) ? true : false,
    tc:     (( flagI & 0x0200 )) ? true : false,
    rd:     (( flagI & 0x0100 )) ? true : false,
    ra:     (( flagI & 0x0080 )) ? true : false,
    z:      (( flagI & 0x0040 )) ? true : false,
    ad:     (( flagI & 0x0020 )) ? true : false, 
    cd:     (( flagI & 0x0010 )) ? true : false,
    rcode:  (( flagI & 0x000F ))  
  }

  qdCount = b.readUInt16BE(4);  // # questions
  anCount = b.readUInt16BE(6);  // # answers
  nsCount = b.readUInt16BE(8);  // # nameservers
  adCount = b.readUInt16BE(10); // # additional

  // XXX qdcount tells us how many questions there are
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
   
   	console.log(q);
    questions.push(q);
  }

	res = {
		id: reqId,
		flags: flags,
		qdCount: qdCount,
		anCount: anCount,
		nsCount: nsCount,
		srCount: adCount,
		questions: questions,
		src: src,
		raw: raw
	};

	console.log(res);
	return res;

};

var createMessage = function(req) {
	var message = new DnsMessage(req);
	message._raw = req.raw;
	message._source = req.src;
	return message;
}

module.exports = {
	createMessage: createMessage,
	parseMessage: parseMessage,
}
