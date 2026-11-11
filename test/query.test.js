'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const named = require('../lib');
const dnsBuffer = require('./dnsbuffer');

const sample = dnsBuffer.samples[0];

const src = {
  family: 'udp4',
  address: '127.0.0.1',
  port: 23456
};

function createQuery() {
  const raw = { buf: sample.raw, len: sample.raw.length };
  return named.Query.createQuery(named.Query.parse(raw, src));
}

test('decode a query datagram', () => {
  const raw = { buf: sample.raw, len: sample.raw.length };
  const decoded = named.Query.parse(raw, src);
  assert.equal(decoded.id, 0x0f34);
  assert.equal(decoded.qdCount, 1);
  assert.deepEqual(decoded.question,
                   { name: 'ns1.joyent.dev', type: 1, qclass: 1 });
  assert.equal(decoded.src, src);
  assert.equal(decoded.raw, raw);
});

test('create a new query object', () => {
  const query = createQuery();
  assert.equal(query.id, 0x0f34);
  assert.equal(query.name(), 'ns1.joyent.dev');
  assert.equal(query.type(), 'A');
  assert.equal(query.operation(), 'query');
  assert.deepEqual(query.answers(), []);
});

test('encode an null-response query object', () => {
  const query = createQuery();
  query.encode();
  assert.ok(query._raw.buf.equals(sample.raw));
  assert.equal(query._raw.len, sample.raw.length);
});

test('add answers to a query', () => {
  const query = createQuery();
  const a = new named.ARecord('127.0.0.1');
  const b = new named.ARecord('127.0.0.2');
  query.addAnswer('ns1.joyent.dev', a);
  query.addAnswer('ns1.joyent.dev', b, 0);
  assert.deepEqual(query.answers(), [
    { name: 'ns1.joyent.dev', type: 'A', record: a, ttl: 5 },
    { name: 'ns1.joyent.dev', type: 'A', record: b, ttl: 0 }
  ]);

  query.encode();
  const buf = query._raw.buf;
  assert.equal(buf.readUInt16BE(6), 2);  // anCount
  assert.equal(buf.length, sample.raw.length + 2 * 16);
});

test('reject invalid answers', () => {
  const query = createQuery();
  const record = new named.ARecord('127.0.0.1');
  assert.throws(() => query.addAnswer(null, record), TypeError);
  assert.throws(() => query.addAnswer('example.com', null), TypeError);
  assert.throws(() => query.addAnswer('example.com', record, '5'), TypeError);
  assert.throws(() => query.addAnswer('example.com', { _type: 'NOPE' }),
                /unknown queryType/);
  assert.deepEqual(query.answers(), []);
});

test('respond requires a server', () => {
  assert.throws(() => createQuery().respond());
});
