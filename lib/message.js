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
  this._question = arg.question;
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
		question: this._question,
		answer: this._answers,
		authority: this._authority,
		additional: this._additional
	}

	console.log(toPack);

	var encoded = new Buffer(16); //XXX TODO
	
	this._raw = { 
		buf: encoded,
		len: encoded.length
	};

	console.log(this._raw);

}

parseMessage = function (raw, src) {
	var b = raw.buf;
	var dobj = protocol.decode(b, 'queryMessage');
  	
	if (!dobj.val) 
		return null;

	// TODO get rid of this intermediate format
	// (or justify it)
  var d = dobj.val;
	var res = {
		id: d.header.id,
		flags: d.header.flags,
		qdCount: d.header.qdcount,
		anCount: d.header.ancount,
		nsCount: d.header.nscount,
		srCount: d.header.srcount,
		question: d.question, //XXX
		src: src,
		raw: raw
	}

	console.log(res);
  return res;	
}

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
