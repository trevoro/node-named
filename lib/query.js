var protocol = require('./protocol');
var queryTypes = protocol.queryTypes;

class Query {
    constructor(arg) {
        if (typeof (arg) !== 'object')
            throw new TypeError('arg (object) is missing');

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

    answers() {
        return this._answers.map((r) => {
            return {
                name: r.name,
                type: queryTypes[r.rtype],
                record: r.rdata,
                ttl: r.rttl
            };
        });
    }

    name() {
        return this._question.name;
    }

    type() {
        return queryTypes[this._question.type];
    }

    operation() {
        switch (this._flags.opcode) {
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
                break;
            default:
                throw new Error('invalid operation %d', this._flags.opcode);
                break;
        }
    }

    encode() {
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

    addAnswer(name, record, ttl) {
        if (typeof (name) !== 'string')
            throw new TypeError('name (string) required');
        if (typeof (record) !== 'object')
            throw new TypeError('record (Record) required');
        if (ttl !== undefined && typeof (ttl) !== 'number')
            throw new TypeError('ttl (number) required');

        if (!queryTypes.hasOwnProperty(record._type))
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

        this._answers.push({
            name: name,
            rtype: queryTypes[record._type],
            rclass: 1,  // INET
            rttl: ttl || 5,
            rdata: record
        });
        this._anCount++;
    }
}

module.exports = {
    createQuery: (req) => {
        var query = new Query(req);
        query._raw = req.raw;
        query._client = req.src;
        return (query);
    },

    parse: (raw, src) => {
        var dobj, b = raw.buf;
        dobj = protocol.decode(b, 'queryMessage');

        if (!dobj.val) return null;

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

        return (res);
    }
}