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
  this._recursionAvailable = false; // set on response
  this._responseCode = 0;
  this._qdCount = arg.qdCount;
  this._anCount = arg.anCount || 0;
  this._nsCount = arg.nsCount || 0;
  this._srCount = arg.srCount || 0;
  this._flags = arg.flags;
  this._question = arg.question;
  this._answers = [];

  this._raw = null;
  this._client = null;

}

Query.prototype.answers = function() {
	return this._answers.map(function(r) {
	  return { name: r.name, type: queryTypes[r.rtype], record: r.rdata, ttl: r.rttl }
	});
}

Query.prototype.name = function() {
  return this._question.name
}

Query.prototype.type = function() {
  return queryTypes[this._question.type];
}

Query.prototype.operation = function() {
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
      anCount: this._anCount,
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

Query.prototype.addAnswer = function(name, record, type, ttl) {

  type = type.toUpperCase();
  
  if (queryTypes.hasOwnProperty(type) === false)
    throw new TypeError('unknown queryType: ' + type);

  var answer = {
    name:   name, 
    rtype:  queryTypes[type],
    rclass: 1,  // INET
    rttl:   ttl || 5,
    rdata:  record 
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
  this._anCount++;
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
  query._client = req.src;
  return query;
}

module.exports = {
  createQuery: createQuery,
  parse: parseQuery,
}
