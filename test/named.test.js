'use strict';

const assert = require('node:assert/strict');
const dgram = require('node:dgram');
const { Resolver } = require('node:dns').promises;
const { once } = require('node:events');
const { after, before, test } = require('node:test');

const named = require('../lib');
const dnsBuffer = require('./dnsbuffer');

const PORT = 9999;
const HOST = '127.0.0.1';

// The answers are checked by the resolver of node, rather than by our own
// protocol code
const resolver = new Resolver({ timeout: 1000, tries: 1 });
resolver.setServers([HOST + ':' + PORT]);

let server;
const responses = [];

function listen(srv, port, address) {
  return new Promise((resolve, reject) => {
    srv.once('error', reject);
    if (address)
      srv.listen(port, address, resolve);
    else
      srv.listen(port, resolve);
  });
}

function close(srv) {
  return new Promise((resolve) => srv.close(resolve));
}

// sends a raw datagram, and resolves with the first response to it
async function exchange(type, port, address, message) {
  const socket = dgram.createSocket(type);
  try {
    socket.send(message, port, address);
    const [response] = await once(socket, 'message',
                                  { signal: AbortSignal.timeout(1000) });
    return response;
  } finally {
    socket.close();
  }
}


///--- Tests

before(async () => {
  server = named.createServer();

  server.on('query', (query) => {
    const domain = query.name();

    switch (query.type()) {
    case 'A':
      query.addAnswer(domain, new named.ARecord('127.0.0.1'));
      break;
    case 'AAAA':
      query.addAnswer(domain, new named.AAAARecord('::1'));
      break;
    case 'CNAME':
      query.addAnswer(domain, new named.CNAMERecord('cname.example.com'));
      break;
    case 'NS':
      query.addAnswer(domain, new named.NSRecord('ns.example.com'));
      break;
    case 'MX':
      query.addAnswer(domain, new named.MXRecord('smtp.example.com'));
      break;
    case 'SOA':
      query.addAnswer(domain, new named.SOARecord('example.com'));
      break;
    case 'SRV':
      query.addAnswer(domain, new named.SRVRecord('sip.example.com', 5060));
      break;
    case 'TXT':
      query.addAnswer(domain, new named.TXTRecord('hello world'));
      break;
    }
    query.respond();
  });

  server.on('after', (query, bytes) => {
    responses.push({ query: query, bytes: bytes });
  });

  await listen(server, PORT, HOST);
});

after(async () => {
  await close(server);
});


test('listen and close (port only)', async () => {
  // don't conflict with the server made in 'before'
  const srv = named.createServer();
  await listen(srv, 1153);
  try {
    assert.match(srv.toString(), /name=named, socket=\{.*"port":1153.*\}/);
  } finally {
    await close(srv);
  }
  assert.match(srv.toString(), /socket=\{\}/);
});

test('listen and close (port and ::1)', async () => {
  const srv = named.createServer({ name: 'six' });
  let closed = false;
  let client;
  srv.on('close', () => { closed = true; });
  srv.on('query', (query) => {
    client = query._client;
    query.respond();
  });

  await listen(srv, String(1153), '::1');

  try {
    const sample = dnsBuffer.samples[1];
    const response = await exchange('udp6', 1153, '::1', sample.raw);
    assert.equal(response.readUInt16BE(0), sample.raw.readUInt16BE(0));
    assert.equal(client.family, 'udp6');
    assert.equal(client.address, '::1');
  } finally {
    await close(srv);
  }
  assert.equal(closed, true);
});

test('close a server that is not listening', async () => {
  await close(named.createServer());
});

test('answer query: example.com (A)', async () => {
  const answers = await resolver.resolve4('example.com', { ttl: true });
  assert.deepEqual(answers, [{ address: '127.0.0.1', ttl: 5 }]);
});

test('answer query: example.com (AAAA)', async () => {
  const answers = await resolver.resolve6('example.com', { ttl: true });
  assert.deepEqual(answers, [{ address: '::1', ttl: 5 }]);
});

test('answer query: example.com (CNAME)', async () => {
  const answers = await resolver.resolveCname('www.example.com');
  assert.deepEqual(answers, ['cname.example.com']);
});

test('answer query: example.com (NS)', async () => {
  const answers = await resolver.resolveNs('example.com');
  assert.deepEqual(answers, ['ns.example.com']);
});

test('answer query: example.com (MX)', async () => {
  const answers = await resolver.resolveMx('example.com');
  assert.equal(answers.length, 1);
  assert.equal(answers[0].exchange, 'smtp.example.com');
  assert.equal(answers[0].priority, 0);
});

test('answer query: example.com (SOA)', async () => {
  const answer = await resolver.resolveSoa('example.com');
  assert.equal(answer.nsname, 'example.com');
  assert.equal(answer.hostmaster, 'hostmaster.example.com');
  assert.equal(answer.serial, 0);
  assert.equal(answer.refresh, 10);
  assert.equal(answer.retry, 10);
  assert.equal(answer.expire, 10);
  assert.equal(answer.minttl, 10);
});

test('answer query: example.com (SRV)', async () => {
  const answers = await resolver.resolveSrv('_sip._tcp.example.com');
  assert.equal(answers.length, 1);
  assert.equal(answers[0].name, 'sip.example.com');
  assert.equal(answers[0].port, 5060);
  assert.equal(answers[0].priority, 0);
  assert.equal(answers[0].weight, 10);
});

test('answer query: example.com (TXT)', async () => {
  const answers = await resolver.resolveTxt('example.com');
  assert.deepEqual(answers, [['hello world']]);
});

test('null-response for a type without answers', async () => {
  // a PTR query, which the handler does not answer
  const raw = dnsBuffer.encode('ab cd 01 00 00 01 00 00 00 00 00 00 ' +
                               '03 6e 73 31 06 6a 6f 79 65 6e 74 03 64 65 ' +
                               '76 00 00 0c 00 01');
  const response = await exchange('udp4', PORT, HOST, raw);
  const expected = Buffer.from(raw);
  expected[2] |= 0x80;  // only the QR bit differs
  assert.ok(response.equals(expected));
});

test('sections of the client are not echoed in the counts', async () => {
  // an A query carrying an EDNS OPT record in the additional section
  const raw = dnsBuffer.encode('12 34 01 00 00 01 00 00 00 00 00 01 ' +
                               '07 65 78 61 6d 70 6c 65 03 63 6f 6d 00 ' +
                               '00 01 00 01 ' +
                               '00 00 29 10 00 00 00 00 00 00 00');
  const response = await exchange('udp4', PORT, HOST, raw);
  assert.equal(response.readUInt16BE(4), 1);   // qdCount
  assert.equal(response.readUInt16BE(6), 1);   // anCount
  assert.equal(response.readUInt16BE(8), 0);   // nsCount
  assert.equal(response.readUInt16BE(10), 0);  // arCount
  assert.equal(response.length, 12 + 17 + 16);
});

test('the after event reports each response', () => {
  assert.ok(responses.length > 0);
  for (const response of responses) {
    assert.equal(response.bytes, response.query._raw.len);
    assert.equal(response.query._client.family, 'udp4');
  }
});

test('invalid datagrams emit clientError', async () => {
  const error = once(server, 'clientError',
                     { signal: AbortSignal.timeout(1000) });
  const socket = dgram.createSocket('udp4');
  socket.send(Buffer.from('not dns'), PORT, HOST, () => socket.close());

  const [err] = await error;
  assert.ok(err instanceof Error);
  assert.equal(err.name, 'ProtocolError');
  assert.equal(err.code, 1);
  assert.equal(err.message(), 'invalid DNS datagram');
});

test('errors thrown by a query handler emit uncaughtException', async () => {
  const srv = named.createServer({
    log: { child: () => ({ warn() {}, trace() {} }) }
  });
  const failure = new Error('boom');
  srv.on('query', () => { throw failure; });
  await listen(srv, 1154, HOST);

  try {
    const error = once(srv, 'uncaughtException',
                       { signal: AbortSignal.timeout(1000) });
    const socket = dgram.createSocket('udp4');
    socket.send(dnsBuffer.samples[0].raw, 1154, HOST, () => socket.close());
    assert.equal((await error)[0], failure);
  } finally {
    await close(srv);
  }
});

test('responses that can not be encoded emit uncaughtException', async () => {
  const srv = named.createServer({
    log: { child: () => ({ warn() {}, trace() {} }) }
  });
  let sent;
  srv.on('query', (query) => {
    query.addAnswer(query.name(), new named.ARecord('not an address'));
    sent = query.respond();
  });
  await listen(srv, 1154, HOST);

  try {
    const error = once(srv, 'uncaughtException',
                       { signal: AbortSignal.timeout(1000) });
    const socket = dgram.createSocket('udp4');
    socket.send(dnsBuffer.samples[0].raw, 1154, HOST, () => socket.close());

    const [err] = await error;
    assert.equal(err.name, 'ExceptionError');
    assert.equal(err.message(), 'unable to encode response');
    assert.equal(sent, false);
  } finally {
    await close(srv);
  }
});
