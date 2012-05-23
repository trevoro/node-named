var protocol = require('./protocol');
var ipaddr = require('ipaddr.js');
var protocol = require('./protocol');
var queryTypes = protocol.queryTypes


var Query = function(arg) {
  if (typeof(arg) !== 'object') {
    throw new TypeError('arg (object) is missing');
  }

  var self = this;

  this.id = arg.id;
  this._truncated = false;
  this._authoritative = false;  // set on response
  this._recursionAvail = false; // set on response
  this._responseCode = 0;
  this._qdCount = arg.qdCount;
  this._anCount = arg.anCount;
  this._nsCount = arg.nsCount;
  this._srCount = arg.srCount;
  this._flags = arg.flags;
  this._question = arg.question;
  this._answers = [];

  this.name = arg.question.name;
  this.type = arg.question.type;

  this._raw = null;
  this._source = null;

  this.__defineGetter__('truncated', function() {
    return (self._truncated);
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
 
  this.__defineGetter__('responseCode', function() {
    return (self._responseCode);
  });

  this.__defineSetter__('recursionAvail', function(v) {
    self._flags.ra = v;
  });

}

Query.prototype.getAnswers = function() {
	return this._answers;
}

Query.prototype.getType = function() {
  return queryTypes[this.type];
}
  
Query.prototype.getOperation = function() {
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
}

Query.prototype.encode = function() {
  var header, question, answer, rSize, rBuffer;

  // TODO get rid of this intermediate format (or justify it)
  var toPack = {
    header: {
      id: this.id,
      flags: this._flags,
      qdCount: this._qdCount,
      anCount: this._answers.length,
      nsCount: this._nsCount,
      srCount: this._srCount
    },
    question: this._question,
    answers: this._answers,
    authority: this._authority,
    additional: this._additional
  }
  
  var encoded = protocol.encode(toPack, 'answerMessage');

  this._raw = { 
    buf: encoded,
    len: encoded.length
  };

}

Query.prototype.addAnswer = function(name, target, type, ttl) {

  type = type.toUpperCase();
  
  if (queryTypes.hasOwnProperty(type) === false)
    throw new TypeError('unknown queryType: ' + type);

  var answer = {
    name:   name, 
    rtype:  queryTypes[type],
    rclass: 1,  // INET
    rttl:   ttl || 5,
    rdata:  target 
  };

  // Note:
  //
  // You can only have multiple answers in certain circumstances in no 
  // circumstance can you mix different answer types other than 'A' with 
  // 'AAAA' unless they are in the 'additional' section.
  //
  // There are also restrictions on what you can answer with depending on the
  // question. 
  //
  // We will not attempt to enforce that here at the moment.

  this._answers.push(answer);
}

parseQuery = function (raw, src) {
  var dobj, b = raw.buf;
  
	dobj = protocol.decode(b, 'queryMessage');
    
  if (!dobj.val) 
    return null;

  // TODO get rid of this intermediate format (or justify it)
  var d = dobj.val;
  var res = {
    id: d.header.id,
    flags: d.header.flags,
    qdCount: d.header.qdCount,
    anCount: d.header.anCount,
    nsCount: d.header.nsCount,
    srCount: d.header.srCount,
    question: d.question, //XXX
    src: src,
    raw: raw
  }

  return res; 
}

var createQuery = function(req) {
  var query = new Query(req);
  query._raw = req.raw;
  query._source = req.src;
  return query;
}

module.exports = {
  createQuery: createQuery,
  parse: parseQuery,
}
