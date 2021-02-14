import { decode, encode, QueryType, QueryTypes } from "./protocol";
import { DnsRecord } from "./records";

export interface QueryFlags {
  qr?: number;
  opcode: number;
}

export interface QueryOptions {
  src: QuerySource;
  raw: RawQuery | null;
  question: any;
  flags: QueryFlags;
  srCount: number;
  nsCount: number;
  anCount: number;
  qdCount: number;
  id: string;
}

export interface QueryAnswer {
  rclass: number;
  rttl: number;
  rdata: DnsRecord;
  rtype: QueryType;
  name: string;
}

export interface QueryQuestion {
  name: string;
  type: QueryType;
}

export default class Query {
  id: string;
  private _truncated: boolean;
  private _authoritative: boolean;
  private _recursionAvailable: boolean;
  private _responseCode: number;
  private _qdCount: number;
  private _anCount: number;
  private _nsCount: number;
  private _srCount: number;
  _flags: QueryFlags;
  private _question: QueryQuestion;
  private _answers: QueryAnswer[];
  _raw: { buf: Buffer; len: number } | null;
  _client: QuerySource;
  private _authority: any;
  private _additional: any;
  public respond?: () => any;

  constructor(arg: QueryOptions) {
    if (typeof arg !== "object") {
      throw new TypeError("arg (object) is missing");
    }
    this.id = arg.id;
    this._truncated = false;
    this._authoritative = false; // set on response
    this._recursionAvailable = false; // set on response
    this._responseCode = 0;
    this._qdCount = arg.qdCount;
    this._anCount = arg.anCount || 0;
    this._nsCount = arg.nsCount || 0;
    this._srCount = arg.srCount || 0;
    this._flags = arg.flags;
    this._question = arg.question;
    this._answers = [];
    this._raw = arg.raw;
    this._client = arg.src;
  }

  answers() {
    return this._answers.map((r) => ({
      name: r.name,
      type: QueryTypes[r.rtype],
      record: r.rdata,
      ttl: r.rttl,
    }));
  }

  get name() {
    return this._question.name;
  }

  get type() {
    return QueryTypes[this._question.type];
  }

  operation() {
    switch (this._flags.opcode) {
      case 0:
        return "query";
      case 2:
        return "status";
      case 4:
        return "notify";
      case 5:
        return "update";
      default:
        throw new Error(`invalid operation ${this._flags.opcode}`);
    }
  }

  encode() {
    // TODO get rid of this intermediate format (or justify it)
    const toPack = {
      header: {
        id: this.id,
        flags: this._flags,
        qdCount: this._qdCount,
        anCount: this._anCount,
        nsCount: this._nsCount,
        srCount: this._srCount,
      },
      question: this._question,
      answers: this._answers,
      authority: this._authority,
      additional: this._additional,
    };

    const encoded = encode(toPack, "answerMessage");

    this._raw = {
      buf: encoded,
      len: encoded.length,
    };
  }

  addAnswer(name: string, record: DnsRecord, ttl?: number) {
    if (!QueryTypes.hasOwnProperty(record.type)) {
      throw new Error("unknown queryType: " + record.type);
    }

    const answer: QueryAnswer = {
      name: name,
      rtype: QueryTypes[record.type as QueryType] as QueryType,
      rclass: 1, // INET
      rttl: ttl || 5,
      rdata: record,
    };

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

    this._answers.push(answer);
    this._anCount++;
  }
}

export interface QuerySource {
  family: "udp6";
  address: string;
  port: number;
}

export interface RawQuery {
  buf: Buffer;
  len: number;
}

export function parse(raw: RawQuery, src: QuerySource) {
  const b = raw.buf;
  const dobj = decode(b, "queryMessage");
  if (!dobj.val) {
    return null;
  }
  // TODO get rid of this intermediate format (or justify it)
  const d = dobj.val;
  return {
    id: d.header.id,
    flags: d.header.flags,
    qdCount: d.header.qdCount,
    anCount: d.header.anCount,
    nsCount: d.header.nsCount,
    srCount: d.header.srCount,
    question: d.question, //XXX
    src: src,
    raw: raw,
  };
}

export function createQuery(req: QueryOptions) {
  return new Query(req);
}
