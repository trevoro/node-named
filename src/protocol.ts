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

*/

import ipaddr from "ipaddr.js";

const QCLASS_IN = 0x01; // the internet
const QCLASS_CS = 0x02; // obsolete
const QCLASS_CH = 0x03; // chaos class. yes this actually exists
const QCLASS_HS = 0x04; // Hesiod

const Formats = {
  answer: {
    name: { type: "_nsName" },
    rtype: { type: "UInt16BE" },
    rclass: { type: "UInt16BE" },
    rttl: { type: "UInt32BE" },
    rdata: { type: "_nsData" }, // rdlength is prepended to this field
  },
  question: {
    name: { type: "_nsName" },
    type: { type: "UInt16BE" },
    qclass: { type: "UInt16BE" },
  },
  header: {
    id: { type: "UInt16BE" },
    flags: { type: "_nsFlags" },
    qdCount: { type: "UInt16BE" },
    anCount: { type: "UInt16BE" },
    nsCount: { type: "UInt16BE" },
    srCount: { type: "UInt16BE" },
  },
  soa: {
    host: { type: "_nsName" },
    admin: { type: "_nsName" },
    serial: { type: "UInt32BE" },
    refresh: { type: "UInt32BE" },
    retry: { type: "UInt32BE" },
    expire: { type: "UInt32BE" },
    ttl: { type: "UInt32BE" },
  },
  mx: {
    priority: { type: "UInt16BE" },
    exchange: { type: "_nsName" },
  },
  txt: {
    text: { type: "_nsText" },
  },
  srv: {
    priority: { type: "UInt16BE" },
    weight: { type: "UInt16BE" },
    port: { type: "UInt16BE" },
    target: { type: "_nsName" },
  },
  queryMessage: {
    header: { type: { format: "header" } },
    question: { type: { format: "question" } },
  },
  answerMessage: {
    header: { type: { format: "header" } },
    question: { type: { format: "question" } },
    answers: { type: "_nsAnswers" },
  },
};

// turns a dotted-decimal address into a UInt32
function parseIPv4(addr: string) {
  const octets = addr.split(/\./).map(function (octet) {
    return parseInt(octet, 10);
  });
  if (octets.length !== 4) {
    throw new TypeError("valid IP address required");
  }
  return (
    octets[0] * Math.pow(256, 3) +
    octets[1] * Math.pow(256, 2) +
    octets[2] * 256 +
    octets[3]
  );
}

function parseIPv6(addr: string): number[] | undefined {
  try {
    return (ipaddr.parse(addr) as ipaddr.IPv6).parts;
  } catch (e) {}
}

// each of these serializers are functions which accept a value to serialize
// and must returns the serialized value as a buffer
const serializers = {
  UInt32BE: {
    encoder: (v: number) => {
      const b = Buffer.allocUnsafe(4);
      b.writeUInt32BE(v, 0);
      return b;
    },
    decoder: (v: Buffer, p: number) => v.readUInt32BE(p),
  },
  UInt16BE: {
    encoder: (v: number) => {
      const b = Buffer.allocUnsafe(2);
      b.writeUInt16BE(v, 0);
      return b;
    },
    decoder: (v: Buffer, p: number) => {
      const res = v.readUInt16BE(p);
      return { val: res, len: 2 };
    },
  },
  _nsAnswers: {
    encoder: (v: any) => {
      let s = 0;
      let p = 0;
      let answers = [];
      for (let i in v) {
        const r = encode(v[i], "answer");
        answers.push(r);
        s = s + r.length;
      }
      const b = Buffer.allocUnsafe(s);
      for (let n in answers) {
        answers[n].copy(b, p);
        p = p + answers[n].length;
      }
      return b;
    },
    decoder: () => {
      throw new Error(`Decode Unsupported`);
    },
  },
  _nsFlags: {
    encoder: (v: any) => {
      if (typeof v !== "object") {
        throw new TypeError("flag must be an object");
      }
      const b = Buffer.allocUnsafe(2);
      let f = 0x0000;
      f = f | (v.qr << 15);
      f = f | (v.opcode << 11);
      f = f | (v.aa << 10);
      f = f | (v.tc << 9);
      f = f | (v.rd << 8);
      f = f | (v.ra << 7);
      f = f | (v.z << 6);
      f = f | (v.ad << 5);
      f = f | (v.cd << 4);
      f = f | v.rcode;
      b.writeUInt16BE(f, 0);
      return b;
    },
    decoder: (v: Buffer, p: number) => {
      const flags = v.readUInt16BE(p);
      const f = {
        qr: !!(flags & 0x8000),
        opcode: flags & 0x7800,
        aa: !!(flags & 0x0400),
        tc: !!(flags & 0x0200),
        rd: !!(flags & 0x0100),
        ra: !!(flags & 0x0080),
        z: !!(flags & 0x0040),
        ad: !!(flags & 0x0020),
        cd: !!(flags & 0x0010),
        rcode: flags & 0x000f,
      };
      return { val: f, len: 2 };
    },
  },
  _nsIP4: {
    encoder: (v: string) => {
      const b = Buffer.allocUnsafe(4);
      b.writeUInt32BE(parseIPv4(v), 0);
      return b;
    },
    decoder: () => {
      throw new Error(`Decode Unsupported`);
    },
  },
  _nsIP6: {
    encoder: function (v: string) {
      const a = parseIPv6(v)!;
      const b = Buffer.allocUnsafe(16);
      for (let i = 0; i < 8; i++) {
        b.writeUInt16BE(a[i], i * 2);
      }
      return b;
    },
    decoder: () => {
      throw new Error(`Decode Unsupported`);
    },
  },
  _nsName: {
    encoder: (v: string) => {
      const n = v.split(/\./);
      const b = Buffer.allocUnsafe(n.toString().length + 2);
      let o = 0; //offset
      for (let i = 0; i < n.length; i++) {
        const l = n[i].length;
        b[o] = l;
        b.write(n[i], ++o, l, "utf8");
        o += l;
      }
      b[o] = 0x00;
      return b;
    },
    decoder: (v: Buffer, p: number) => {
      let start = p;
      const name = [];

      let rlen = v.readUInt8(p);
      while (rlen != 0x00) {
        p++;
        name.push(v.slice(p, p + rlen).toString());
        p = p + rlen;
        rlen = v.readUInt8(p);
      }
      return { val: name.join("."), len: p - start + 1 };
    },
  },
  _nsText: {
    encoder: function (v: string) {
      const b = Buffer.allocUnsafe(v.length + 1);
      b.writeUInt8(v.length, 0);
      b.write(v, 1);
      return b;
    },
    decoder: () => {
      throw new Error(`Decode Unsupported`);
    },
  },
  _nsData: {
    encoder: function (v: any, t: any) {
      let r: Buffer;
      // TODO with the new queryTypes layout this could probably be mostly
      // eliminated
      switch (t) {
        case QueryTypes["A"]:
          r = serializers["_nsIP4"].encoder(v.target);
          break;
        case QueryTypes["CNAME"]:
          r = serializers["_nsName"].encoder(v.target);
          break;
        case QueryTypes["NS"]:
          r = serializers["_nsName"].encoder(v.target);
          break;
        case QueryTypes["SOA"]:
          r = encode(v, "soa");
          break;
        case QueryTypes["MX"]:
          r = encode(v, "mx");
          break;
        case QueryTypes["TXT"]:
          r = serializers["_nsText"].encoder(v.target);
          break;
        case QueryTypes["AAAA"]:
          r = serializers["_nsIP6"].encoder(v.target);
          break;
        case QueryTypes["SRV"]:
          r = encode(v, "srv");
          break;
        default:
          throw new Error("unrecognized nsdata type");
      }

      const l = r.length;
      const b = Buffer.allocUnsafe(l + 2);
      b.writeUInt16BE(l, 0);
      r.copy(b, 2);
      return b;
    },
    decoder: () => {
      throw new Error(`Decode Unsupported`);
    },
  },
};

export function encode(obj: any, format: keyof typeof Formats): Buffer {
  const fmt = Formats[format];
  return Buffer.concat(
    Object.keys(fmt).map((f) => {
      let type = (fmt as any)[f].type as
        | keyof typeof serializers
        | { format: keyof typeof Formats };
      if (typeof type === "string") {
        //XXX I dont like this
        if (type == "_nsData") {
          return serializers["_nsData"].encoder(obj[f], obj["rtype"]);
        } else {
          return serializers[type].encoder(obj[f]);
        }
      } else if (typeof type === "object") {
        return encode(obj[f], type.format);
      }
      throw new TypeError("Invalid Type");
    })
  );
}

export function decode<T extends keyof typeof Formats>(
  raw: Buffer,
  format: T,
  pos: number = 0
): {
  val: Record<keyof typeof Formats[T], any>;
  len: number;
} {
  const fmt = Formats[format];
  const result = Object.keys(fmt).reduce((result, f) => {
    let res;
    const type = (fmt as any)[f].type as
      | keyof typeof serializers
      | { format: keyof typeof Formats };

    // if the type is a string its a reference to a serializer
    // if the type is an object its a nested format and we call decode again
    // with the appropriate offset

    if (typeof type === "string") {
      res = serializers[type].decoder(raw, pos);
    } else if (typeof type === "object") {
      res = decode(raw, type.format, pos);
    } else {
      throw new TypeError("invalid type");
    }

    pos += (res as any).len;
    result[f] = (res as any).val;
    return result;
  }, {} as any);
  return { val: result, len: pos };
}

export const QueryTypes = {
  A: 0x01, // ipv4 address
  NS: 0x02, // nameserver
  MD: 0x03, // obsolete
  MF: 0x04, // obsolete
  CNAME: 0x05, // alias
  SOA: 0x06, // start of authority
  MB: 0x07, // experimental
  MG: 0x08, // experimental
  MR: 0x09, // experimental
  NULL: 0x0a, // experimental null RR
  WKS: 0x0b, // service description
  PTR: 0x0c, // reverse entry (inaddr.arpa)
  HINFO: 0x0d, // host information
  MINFO: 0x0e, // mailbox or mail list information
  MX: 0x0f, // mail exchange
  TXT: 0x10, // text strings
  AAAA: 0x1c, // ipv6 address
  SRV: 0x21, // srv records
  AXFR: 0xfc, // request to transfer entire zone
  MAILA: 0xfe, // request for mailbox related records
  MAILB: 0xfd, // request for mail agent RRs
  ANY: 0xff, // any class
  0x01: "A", // ipv4 address
  0x02: "NS", // nameserver
  0x03: "MD", // obsolete
  0x04: "MF", // obsolete
  0x05: "CNAME", // alias
  0x06: "SOA", // start of authority
  0x07: "MB", // experimental
  0x08: "MG", // experimental
  0x09: "MR", // experimental
  0x0a: "NULL", // experimental null RR
  0x0b: "WKS", // service description
  0x0c: "PTR", // reverse entry (inaddr.arpa)
  0x0d: "HINFO", // host information
  0x0e: "MINFO", // mailbox or mail list information
  0x0f: "MX", // mail exchange
  0x10: "TXT", // text strings
  0x1c: "AAAA", // ipv6 address
  0x21: "SRV", // srv records
  0xfc: "AXFR", // request to transfer entire zone
  0xfe: "MAILA", // request for mailbox related records
  0xfd: "MAILB", // request for mail agent RRs
  0xff: "ANY", // any class
};
export type QueryType = keyof typeof QueryTypes;
export const DNS_ENOERR = 0x00; // No error
export const DNS_EFORMAT = 0x01; // Formatting Error
export const DNS_ESERVER = 0x02; // server it unable to process
export const DNS_ENONAME = 0x03; // name does not exist
export const DNS_ENOTIMP = 0x04; // feature not implemented on this server
export const DNS_EREFUSE = 0x05;
