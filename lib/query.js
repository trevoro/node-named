'use strict';

const protocol = require('./protocol');

const queryTypes = protocol.queryTypes;

const QCLASS_IN = 1;
const DEFAULT_TTL = 5;

const OPERATIONS = {
  0: 'query',
  2: 'status',
  4: 'notify',
  5: 'update'
};


class Query {
  constructor(arg) {
    if (arg === null || typeof (arg) !== 'object')
      throw new TypeError('arg (object) is missing');

    this.id = arg.id;
    this._qdCount = arg.qdCount;
    this._anCount = arg.anCount || 0;
    this._nsCount = arg.nsCount || 0;
    this._srCount = arg.srCount || 0;
    this._flags = arg.flags;
    this._question = arg.question;
    this._answers = [];

    this._raw = null;
    this._client = null;
    this._server = null;  // set by the server that received the query
  }

  answers() {
    return this._answers.map((r) => ({
      name: r.name,
      type: queryTypes[r.rtype],
      record: r.rdata,
      ttl: r.rttl
    }));
  }

  name() {
    return this._question.name;
  }

  type() {
    return queryTypes[this._question.type];
  }

  operation() {
    const operation = OPERATIONS[this._flags.opcode];
    if (operation === undefined)
      throw new Error('invalid operation ' + this._flags.opcode);
    return operation;
  }

  encode() {
    const encoded = protocol.encode({
      header: {
        id: this.id,
        flags: this._flags,
        // the counts describe what is actually written: a single question,
        // our answers, and no authority or additional records (whatever the
        // client sent in those sections, such as EDNS options, is not echoed)
        qdCount: 1,
        anCount: this._answers.length,
        nsCount: 0,
        srCount: 0
      },
      question: this._question,
      answers: this._answers
    }, 'answerMessage');

    this._raw = {
      buf: encoded,
      len: encoded.length
    };
  }

  addAnswer(name, record, ttl) {
    if (typeof (name) !== 'string')
      throw new TypeError('name (string) required');
    if (record === null || typeof (record) !== 'object')
      throw new TypeError('record (Record) required');
    if (ttl !== undefined && typeof (ttl) !== 'number')
      throw new TypeError('ttl (number) required');

    const rtype = typeof (record._type) === 'string' ?
      queryTypes[record._type] : undefined;
    if (typeof (rtype) !== 'number')
      throw new Error('unknown queryType: ' + record._type);

    // Note:
    //
    // You can only have multiple answers in certain circumstances in no
    // circumstance can you mix different answer types other than 'A' with
    // 'AAAA' unless they are in the 'additional' section.
    //
    // There are also restrictions on what you can answer with depending on
    // the question.
    //
    // We will not attempt to enforce that here at the moment.
    //

    this._answers.push({
      name: name,
      rtype: rtype,
      rclass: QCLASS_IN,
      rttl: ttl === undefined ? DEFAULT_TTL : ttl,
      rdata: record
    });
    this._anCount++;
  }

  respond() {
    if (this._server === null)
      throw new Error('query was not received by a server');
    return this._server.send(this);
  }
}


function parseQuery(raw, src) {
  const decoded = protocol.decode(raw.buf, 'queryMessage').val;
  const header = decoded.header;

  return {
    id: header.id,
    flags: header.flags,
    qdCount: header.qdCount,
    anCount: header.anCount,
    nsCount: header.nsCount,
    srCount: header.srCount,
    question: decoded.question,
    src: src,
    raw: raw
  };
}

function createQuery(req) {
  const query = new Query(req);
  query._raw = req.raw;
  query._client = req.src;
  return query;
}


module.exports = {
  createQuery: createQuery,
  parse: parseQuery
};
