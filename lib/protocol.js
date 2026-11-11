/*

  # Protocol

  Stores protocol definitions and their primitives as well as any other
  associated protocol constants

  ## References

  http://tools.ietf.org/html/rfc1035
  http://tools.ietf.org/html/rfc4408
  http://tools.ietf.org/html/rfc2782
  http://tools.ietf.org/html/rfc3596

  ## Notes

  * Even though RFC1035 says that questions should support multiple queries, the
  reality is *nobody* does this. MS DNS doesn't support it and apparently BIND
  doesn't support it as well. That implies no client side tools do either - so
  we will not worry about that complication.

  * DNS Extensions have been proposed, but another case of chicken-and-egg.
  These extensions make it _possible_ to have DNS queries over 512 bytes in
  length, but because it is not universally supported, nobody does it.

  * A message is encoded in a single pass into one buffer. Names in complete
  messages are compressed with RFC1035 4.1.4 pointers.

*/

'use strict';

const ipaddr = require('ipaddr.js');


///--- Constants

const DNS_ENOERR  = 0x00; // No error
const DNS_EFORMAT = 0x01; // Formatting Error
const DNS_ESERVER = 0x02; // server it unable to process
const DNS_ENONAME = 0x03; // name does not exist
const DNS_ENOTIMP = 0x04; // feature not implemented on this server
const DNS_EREFUSE = 0x05; // refused for policy reasons

const TYPE_CODES = {
  A     : 0x01,   // ipv4 address
  NS    : 0x02,   // nameserver
  MD    : 0x03,   // obsolete
  MF    : 0x04,   // obsolete
  CNAME : 0x05,   // alias
  SOA   : 0x06,   // start of authority
  MB    : 0x07,   // experimental
  MG    : 0x08,   // experimental
  MR    : 0x09,   // experimental
  NULL  : 0x0A,   // experimental null RR
  WKS   : 0x0B,   // service description
  PTR   : 0x0C,   // reverse entry (inaddr.arpa)
  HINFO : 0x0D,   // host information
  MINFO : 0x0E,   // mailbox or mail list information
  MX    : 0x0F,   // mail exchange
  TXT   : 0x10,   // text strings
  AAAA  : 0x1C,   // ipv6 address
  SRV   : 0x21,   // srv records
  AXFR  : 0xFC,   // request to transfer entire zone
  MAILB : 0xFD,   // request for mail agent RRs
  MAILA : 0xFE,   // request for mailbox related records
  ANY   : 0xFF    // any class
};

// Two-way lookup table: name -> code and code -> name
const queryTypes = {};
for (const name of Object.keys(TYPE_CODES)) {
  queryTypes[name] = TYPE_CODES[name];
  queryTypes[TYPE_CODES[name]] = name;
}

const INITIAL_SIZE = 512;        // the classic maximum size of a UDP message
const MAX_NAME_LENGTH = 253;     // without the trailing dot
const MAX_LABEL_LENGTH = 63;
const MAX_STRING_LENGTH = 255;   // a single <character-string>
const MAX_POINTER_OFFSET = 0x3FFF;
const POINTER_MASK = 0xC0;
const DOT = 0x2E;


///--- Writer

// Appends to a single buffer that grows on demand, so that a message is
// encoded without allocating (and then copying) a buffer per field.
class Writer {
  constructor(compress) {
    this.buf = Buffer.allocUnsafe(INITIAL_SIZE);
    this.pos = 0;
    // suffix -> offset of the names already written; null when the output is
    // a fragment, where offsets would not be relative to a message start
    this.names = compress ? new Map() : null;
  }

  reserve(size) {
    const needed = this.pos + size;
    if (needed <= this.buf.length)
      return;

    const grown = Buffer.allocUnsafe(Math.max(this.buf.length * 2, needed));
    this.buf.copy(grown, 0, 0, this.pos);
    this.buf = grown;
  }

  uint16(value) {
    this.reserve(2);
    this.pos = this.buf.writeUInt16BE(value, this.pos);
  }

  uint32(value) {
    this.reserve(4);
    this.pos = this.buf.writeUInt32BE(value, this.pos);
  }

  // `compress` must be false for names that may not be compressed, such as
  // the target of a SRV record (RFC2782)
  name(name, compress) {
    if (typeof (name) !== 'string')
      throw new TypeError('name (string) is required');

    // a trailing dot only marks the name as fully qualified
    let end = name.length;
    if (end > 0 && name.charCodeAt(end - 1) === DOT)
      end--;

    const size = Buffer.byteLength(name) - (name.length - end);
    if (size > MAX_NAME_LENGTH)
      throw new RangeError('name is longer than 253 bytes: ' + name);

    this.reserve(size + 2);

    const names = compress === false ? null : this.names;
    const buf = this.buf;
    let start = 0;

    while (start < end) {
      if (names !== null) {
        const suffix = (start === 0 && end === name.length) ?
          name : name.slice(start, end);
        const offset = names.get(suffix);
        if (offset !== undefined) {
          this.pos = buf.writeUInt16BE(0xC000 | offset, this.pos);
          return;
        }
        if (this.pos <= MAX_POINTER_OFFSET)
          names.set(suffix, this.pos);
      }

      let dot = name.indexOf('.', start);
      if (dot === -1)
        dot = end;

      const length = buf.write(name.slice(start, dot), this.pos + 1, 'utf8');
      if (length === 0 || length > MAX_LABEL_LENGTH)
        throw new RangeError('invalid label in name: ' + name);

      buf[this.pos] = length;
      this.pos += length + 1;
      start = dot + 1;
    }

    buf[this.pos++] = 0x00;
  }

  // one or more <character-string>s, each prefixed by its length
  text(text) {
    if (typeof (text) !== 'string')
      throw new TypeError('text (string) is required');

    const size = Buffer.byteLength(text);
    this.reserve(size + Math.ceil(size / MAX_STRING_LENGTH) + 1);

    if (size <= MAX_STRING_LENGTH) {
      this.buf[this.pos] = size;
      this.pos += this.buf.write(text, this.pos + 1, 'utf8') + 1;
      return;
    }

    const bytes = Buffer.from(text, 'utf8');
    for (let offset = 0; offset < size; offset += MAX_STRING_LENGTH) {
      const length = Math.min(MAX_STRING_LENGTH, size - offset);
      this.buf[this.pos++] = length;
      this.pos += bytes.copy(this.buf, this.pos, offset, offset + length);
    }
  }

  // a dotted-decimal address as 4 bytes
  ipv4(addr) {
    if (typeof (addr) !== 'string')
      throw new TypeError('addr (string) is required');

    this.reserve(4);

    const buf = this.buf;
    const length = addr.length;
    let octets = 0, value = 0, digits = 0;

    for (let i = 0; i <= length; i++) {
      const c = i < length ? addr.charCodeAt(i) : DOT;
      if (c >= 0x30 && c <= 0x39) {
        value = value * 10 + (c - 0x30);
        digits++;
      } else if (c === DOT && digits > 0 && digits <= 3 && value <= 255 &&
                 octets < 4) {
        buf[this.pos + octets++] = value;
        value = 0;
        digits = 0;
      } else {
        throw new TypeError('valid IP address required');
      }
    }

    if (octets !== 4)
      throw new TypeError('valid IP address required');

    this.pos += 4;
  }

  ipv6(addr) {
    if (typeof (addr) !== 'string')
      throw new TypeError('addr (string) is required');

    let parts;
    try {
      parts = ipaddr.IPv6.parse(addr).parts;
    } catch (e) {
      throw new TypeError('valid IPv6 address required');
    }

    this.reserve(16);
    for (let i = 0; i < 8; i++)
      this.pos = this.buf.writeUInt16BE(parts[i], this.pos);
  }

  finish() {
    return this.buf.subarray(0, this.pos);
  }
}


///--- Encoders

function packFlags(flags) {
  if (flags === null || typeof (flags) !== 'object')
    throw new TypeError('flag must be an object');

  return (((flags.qr << 15) |
           ((flags.opcode & 0x0F) << 11) |
           (flags.aa << 10) |
           (flags.tc << 9) |
           (flags.rd << 8) |
           (flags.ra << 7) |
           (flags.z  << 6) |
           (flags.ad << 5) |
           (flags.cd << 4) |
           (flags.rcode & 0x0F)) & 0xFFFF);
}

function writeHeader(w, header) {
  w.uint16(header.id);
  w.uint16(packFlags(header.flags));
  w.uint16(header.qdCount);
  w.uint16(header.anCount);
  w.uint16(header.nsCount);
  w.uint16(header.srCount);
}

function writeQuestion(w, question) {
  w.name(question.name);
  w.uint16(question.type);
  w.uint16(question.qclass);
}

function writeSoa(w, soa) {
  w.name(soa.host);
  w.name(soa.admin);
  w.uint32(soa.serial);
  w.uint32(soa.refresh);
  w.uint32(soa.retry);
  w.uint32(soa.expire);
  w.uint32(soa.ttl);
}

function writeMx(w, mx) {
  w.uint16(mx.priority);
  w.name(mx.exchange);
}

function writeTxt(w, txt) {
  w.text(txt.text);
}

function writeSrv(w, srv) {
  w.uint16(srv.priority);
  w.uint16(srv.weight);
  w.uint16(srv.port);
  w.name(srv.target, false);
}

function writeData(w, type, data) {
  // rdlength is prepended to the data, and only known once it is written
  w.reserve(2);
  const start = w.pos += 2;

  switch (type) {
  case TYPE_CODES.A:
    w.ipv4(data.target);
    break;
  case TYPE_CODES.AAAA:
    w.ipv6(data.target);
    break;
  case TYPE_CODES.CNAME:
  case TYPE_CODES.NS:
    w.name(data.target);
    break;
  case TYPE_CODES.SOA:
    writeSoa(w, data);
    break;
  case TYPE_CODES.MX:
    writeMx(w, data);
    break;
  case TYPE_CODES.TXT:
    w.text(data.target);
    break;
  case TYPE_CODES.SRV:
    writeSrv(w, data);
    break;
  default:
    throw new Error('unrecognized nsdata type');
  }

  w.buf.writeUInt16BE(w.pos - start, start - 2);
}

function writeAnswer(w, answer) {
  w.name(answer.name);
  w.uint16(answer.rtype);
  w.uint16(answer.rclass);
  w.uint32(answer.rttl);
  writeData(w, answer.rtype, answer.rdata);
}

function writeQueryMessage(w, message) {
  writeHeader(w, message.header);
  writeQuestion(w, message.question);
}

function writeAnswerMessage(w, message) {
  writeHeader(w, message.header);
  writeQuestion(w, message.question);

  const answers = message.answers;
  for (let i = 0; i < answers.length; i++)
    writeAnswer(w, answers[i]);
}


///--- Decoders
//
// Each decoder accepts a buffer and the position to read from, and returns
// the decoded value along with the number of bytes it consumed.

function unpackFlags(flags) {
  return {
    qr:     (flags & 0x8000) !== 0,
    opcode: (flags >> 11) & 0x0F,
    aa:     (flags & 0x0400) !== 0,
    tc:     (flags & 0x0200) !== 0,
    rd:     (flags & 0x0100) !== 0,
    ra:     (flags & 0x0080) !== 0,
    z:      (flags & 0x0040) !== 0,
    ad:     (flags & 0x0020) !== 0,
    cd:     (flags & 0x0010) !== 0,
    rcode:  (flags & 0x000F)
  };
}

function readName(buf, start) {
  const labels = [];
  let pos = start;
  let len = 0;  // set once the first pointer has been followed

  for (;;) {
    const length = buf.readUInt8(pos);

    if (length === 0) {
      pos++;
      break;
    }

    if ((length & POINTER_MASK) === POINTER_MASK) {
      const target = buf.readUInt16BE(pos) & MAX_POINTER_OFFSET;
      // pointers may only refer to a prior occurance, which also keeps a
      // malicious message from sending us around in circles
      if (target >= pos)
        throw new RangeError('invalid name pointer');
      if (len === 0)
        len = pos + 2 - start;
      pos = target;
      continue;
    }

    if (length > MAX_LABEL_LENGTH || pos + 1 + length > buf.length)
      throw new RangeError('invalid label length');

    labels.push(buf.toString('utf8', pos + 1, pos + 1 + length));
    pos += length + 1;
  }

  return { val: labels.join('.'), len: len || pos - start };
}

function readHeader(buf, pos) {
  const header = {
    id: buf.readUInt16BE(pos),
    flags: unpackFlags(buf.readUInt16BE(pos + 2)),
    qdCount: buf.readUInt16BE(pos + 4),
    anCount: buf.readUInt16BE(pos + 6),
    nsCount: buf.readUInt16BE(pos + 8),
    srCount: buf.readUInt16BE(pos + 10)
  };
  return { val: header, len: 12 };
}

function readQuestion(buf, pos) {
  const name = readName(buf, pos);
  const question = {
    name: name.val,
    type: buf.readUInt16BE(pos + name.len),
    qclass: buf.readUInt16BE(pos + name.len + 2)
  };
  return { val: question, len: name.len + 4 };
}

function readQueryMessage(buf, pos) {
  const header = readHeader(buf, pos);
  const question = readQuestion(buf, pos + header.len);
  return {
    val: { header: header.val, question: question.val },
    len: header.len + question.len
  };
}


///--- Formats

const FORMATS = {
  answer: { encode: writeAnswer },
  question: { encode: writeQuestion, decode: readQuestion },
  header: { encode: writeHeader, decode: readHeader },
  soa: { encode: writeSoa },
  mx: { encode: writeMx },
  txt: { encode: writeTxt },
  srv: { encode: writeSrv },
  queryMessage: {
    encode: writeQueryMessage,
    decode: readQueryMessage,
    message: true
  },
  answerMessage: { encode: writeAnswerMessage, message: true }
};

function getFormat(format, operation) {
  const fmt = Object.prototype.hasOwnProperty.call(FORMATS, format) ?
    FORMATS[format] : undefined;
  if (!fmt || !fmt[operation])
    throw new TypeError('unable to ' + operation + ' format: ' + format);
  return fmt;
}


///--- API

function encode(obj, format) {
  const fmt = getFormat(format, 'encode');
  const writer = new Writer(fmt.message === true);
  fmt.encode(writer, obj);
  return writer.finish();
}

function decode(raw, format, pos) {
  return getFormat(format, 'decode').decode(raw, pos || 0);
}


///--- Exports

module.exports = {
  DNS_ENOERR,
  DNS_EFORMAT,
  DNS_ESERVER,
  DNS_ENONAME,
  DNS_ENOTIMP,
  DNS_EREFUSE,
  encode,
  decode,
  queryTypes
};
