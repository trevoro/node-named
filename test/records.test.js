'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const named = require('../lib');

const valid = {
  A: () => new named.ARecord('127.0.0.1'),
  AAAA: () => new named.AAAARecord('::1'),
  CNAME: () => new named.CNAMERecord('alias.example.com'),
  NS: () => new named.NSRecord('ns.example.com'),
  MX: () => new named.MXRecord('smtp.example.com'),
  SOA: () => new named.SOARecord('example.com'),
  SRV: () => new named.SRVRecord('_sip._udp.example.com', 5060),
  TXT: () => new named.TXTRecord('hello world')
};

const invalid = {
  A: () => new named.ARecord('::1'),
  AAAA: () => new named.AAAARecord('127.0.0.1'),
  CNAME: () => new named.CNAMERecord('not a hostname'),
  NS: () => new named.NSRecord('-ns.example.com'),
  MX: () => new named.MXRecord('smtp.example.com', {priority: 65536}),
  SOA: () => new named.SOARecord('example.com', {serial: -1}),
  SRV: () => new named.SRVRecord('sip.example.com', 65536),
  TXT: () => new named.TXTRecord('a'.repeat(256))
};

for (const type of Object.keys(valid)) {
  test('create a valid record (' + type + ')', () => {
    const record = valid[type]();
    assert.equal(record._type, type);
    assert.equal(record.valid(), true);
  });

  test('detect an invalid record (' + type + ')', () => {
    assert.equal(invalid[type]().valid(), false);
  });

  test('require the record data (' + type + ')', () => {
    assert.throws(() => new named[type + 'Record'](), TypeError);
  });
}

test('record defaults', () => {
  const opts = {serial: 12345};
  const soa = new named.SOARecord('example.com', opts);
  assert.deepEqual({ ...soa }, {
    host: 'example.com',
    admin: 'hostmaster.example.com',
    serial: 12345,
    refresh: 10,
    retry: 10,
    expire: 10,
    ttl: 10,
    _type: 'SOA'
  });
  // the options of the caller are left alone
  assert.deepEqual(opts, {serial: 12345});

  const mx = new named.MXRecord('smtp.example.com');
  assert.equal(mx.priority, 0);
  assert.equal(mx.ttl, 600);

  const srv = new named.SRVRecord('sip.example.com', 5060, {priority: 1});
  assert.equal(srv.priority, 1);
  assert.equal(srv.weight, 10);
});
