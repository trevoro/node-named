'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const named = require('../lib');
const dnsBuffer = require('./dnsbuffer');

const protocol = named.Protocol;
const queryTypes = protocol.queryTypes;

const HEADER = '0f 34 81 00 00 01 00 01 00 00 00 00';
const QUESTION = '07 65 78 61 6d 70 6c 65 03 63 6f 6d 00';  // example.com

function answerMessage(type, answers) {
  return {
    header: {
      id: 0x0f34,
      flags: { qr: 1, opcode: 0, rd: true, rcode: 0 },
      qdCount: 1,
      anCount: answers.length,
      nsCount: 0,
      srCount: 0
    },
    question: { name: 'example.com', type: queryTypes[type], qclass: 1 },
    answers: answers.map((rdata) => ({
      name: 'example.com',
      rtype: queryTypes[type],
      rclass: 1,
      rttl: 5,
      rdata: rdata
    }))
  };
}

function assertEncodes(type, record, typeHex, rdataHex) {
  const encoded = protocol.encode(answerMessage(type, [record]),
                                  'answerMessage');
  const expected = dnsBuffer.encode([
    HEADER, QUESTION, '00', typeHex, '00 01',
    'c0 0c 00', typeHex, '00 01 00 00 00 05', rdataHex
  ].join(' '));
  assert.equal(encoded.toString('hex'), expected.toString('hex'));
}

for (const sample of dnsBuffer.samples) {
  test('protocol decode/encode: ' + sample.description, () => {
    const decoded = protocol.decode(sample.raw, sample.type);
    const encoded = protocol.encode(decoded.val, sample.type);
    assert.equal(decoded.len, sample.raw.length);
    assert.ok(dnsBuffer.equalBuffers(encoded, sample.raw));
  });
}

test('protocol decode: header flags', () => {
  // a STATUS (opcode 2) query for the root, with recursion desired
  const raw = dnsBuffer.encode('00 01 11 00 00 01 00 00 00 00 00 00 ' +
                               '00 00 01 00 01');
  const decoded = protocol.decode(raw, 'queryMessage').val;
  assert.equal(decoded.header.flags.opcode, 2);
  assert.equal(decoded.header.flags.rd, true);
  assert.equal(decoded.header.flags.qr, false);
  assert.equal(decoded.question.name, '');
  assert.ok(protocol.encode(decoded, 'queryMessage').equals(raw));
});

test('protocol decode: compressed name', () => {
  const raw = dnsBuffer.encode('03 63 6f 6d 00 07 65 78 61 6d 70 6c 65 ' +
                               'c0 00 00 01 00 01');
  const decoded = protocol.decode(raw, 'question', 5);
  assert.deepEqual(decoded.val, { name: 'example.com', type: 1, qclass: 1 });
  assert.equal(decoded.len, 14);
});

test('protocol decode: rejects malformed messages', () => {
  const sample = dnsBuffer.samples[0].raw;
  // truncated in the middle of the question
  assert.throws(() => protocol.decode(sample.subarray(0, 20), 'queryMessage'));
  // truncated header
  assert.throws(() => protocol.decode(sample.subarray(0, 6), 'queryMessage'));
  // a name pointer that refers to itself
  assert.throws(() => protocol.decode(Buffer.from('c000', 'hex'), 'question'));
  // unknown formats
  assert.throws(() => protocol.decode(sample, 'nope'), TypeError);
  assert.throws(() => protocol.encode({}, 'nope'), TypeError);
});

test('protocol encode: A', () => {
  assertEncodes('A', new named.ARecord('127.0.0.1'), '01',
                '00 04 7f 00 00 01');
});

test('protocol encode: AAAA', () => {
  assertEncodes('AAAA', new named.AAAARecord('2001:db8::1'), '1c',
                '00 10 20 01 0d b8 00 00 00 00 00 00 00 00 00 00 00 01');
});

test('protocol encode: CNAME compresses the shared suffix', () => {
  assertEncodes('CNAME', new named.CNAMERecord('cname.example.com'), '05',
                '00 08 05 63 6e 61 6d 65 c0 0c');
});

test('protocol encode: NS', () => {
  assertEncodes('NS', new named.NSRecord('ns.example.com'), '02',
                '00 05 02 6e 73 c0 0c');
});

test('protocol encode: MX', () => {
  assertEncodes('MX', new named.MXRecord('smtp.example.com', {priority: 10}),
                '0f', '00 09 00 0a 04 73 6d 74 70 c0 0c');
});

test('protocol encode: SOA', () => {
  assertEncodes('SOA', new named.SOARecord('example.com', {serial: 12345}),
                '06',
                '00 23 c0 0c 0a 68 6f 73 74 6d 61 73 74 65 72 c0 0c ' +
                '00 00 30 39 00 00 00 0a 00 00 00 0a 00 00 00 0a 00 00 00 0a');
});

test('protocol encode: SRV target is never compressed', () => {
  assertEncodes('SRV', new named.SRVRecord('example.com', 5060), '21',
                '00 13 00 00 00 0a 13 c4 ' +
                '07 65 78 61 6d 70 6c 65 03 63 6f 6d 00');
});

test('protocol encode: TXT', () => {
  assertEncodes('TXT', new named.TXTRecord('hello world'), '10',
                '00 0c 0b 68 65 6c 6c 6f 20 77 6f 72 6c 64');
});

test('protocol encode: long TXT is split into 255 byte strings', () => {
  const encoded = protocol.encode(
    answerMessage('TXT', [new named.TXTRecord('a'.repeat(300))]),
    'answerMessage');
  const rdata = encoded.subarray(encoded.length - 304);
  assert.equal(rdata.readUInt16BE(0), 302);
  assert.equal(rdata[2], 255);
  assert.equal(rdata[2 + 256], 45);
  assert.equal(rdata.toString('latin1', 3, 258), 'a'.repeat(255));
});

test('protocol encode: message larger than the initial buffer', () => {
  const records = [];
  for (let i = 0; i < 100; i++)
    records.push(new named.ARecord('10.0.0.' + i));

  const encoded = protocol.encode(answerMessage('A', records),
                                  'answerMessage');
  assert.equal(encoded.length, 12 + 17 + 100 * 16);
  assert.deepEqual([...encoded.subarray(encoded.length - 4)], [10, 0, 0, 99]);
});

test('protocol encode: trailing dot and root names', () => {
  const fqdn = protocol.encode({ name: 'example.com.', type: 1, qclass: 1 },
                               'question');
  assert.ok(fqdn.equals(dnsBuffer.encode(QUESTION + ' 00 01 00 01')));

  const root = protocol.encode({ name: '.', type: 2, qclass: 1 }, 'question');
  assert.ok(root.equals(dnsBuffer.encode('00 00 02 00 01')));
});

test('protocol encode: fragments are not compressed', () => {
  // a.io + hostmaster.a.io + 5 x uint32
  const soa = protocol.encode(new named.SOARecord('a.io'), 'soa');
  assert.equal(soa.length, 6 + 17 + 20);
});

test('protocol encode: rejects invalid data', () => {
  const encode = (type, record) => {
    protocol.encode(answerMessage(type, [record]), 'answerMessage');
  };
  assert.throws(() => encode('A', new named.ARecord('256.0.0.1')), TypeError);
  assert.throws(() => encode('A', new named.ARecord('1.2.3')), TypeError);
  assert.throws(() => encode('A', new named.ARecord('::1')), TypeError);
  assert.throws(() => encode('AAAA', new named.AAAARecord('1.2.3.4')),
                TypeError);
  assert.throws(() => encode('CNAME', new named.CNAMERecord('a..b')),
                RangeError);
  assert.throws(() => encode('CNAME', new named.CNAMERecord('a'.repeat(64))),
                RangeError);
  assert.throws(() => encode('PTR', { target: 'example.com' }),
                /unrecognized nsdata type/);
});
