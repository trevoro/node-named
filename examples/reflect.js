'use strict';

const named = require('../lib');

const PORT = 9999;
const TTL = 300;
const server = named.createServer();

// answers each supported type of query with a fixed record
const records = {
  A: () => new named.ARecord('127.0.0.1'),
  AAAA: () => new named.AAAARecord('::1'),
  CNAME: () => new named.CNAMERecord('cname.example.com'),
  MX: () => new named.MXRecord('smtp.example.com'),
  NS: () => new named.NSRecord('ns.example.com'),
  SOA: () => new named.SOARecord('example.com'),
  SRV: () => new named.SRVRecord('sip.example.com', 5060),
  TXT: () => new named.TXTRecord('hello world')
};

server.listen(PORT, '127.0.0.1', () => {
  console.log('DNS server started on port %d', PORT);
});

server.on('query', (query) => {
  const domain = query.name();
  const type = query.type();
  console.log('DNS Query: (%s) %s', type, domain);

  if (Object.hasOwn(records, type))
    query.addAnswer(domain, records[type](), TTL);

  server.send(query);
});

server.on('clientError', (error) => {
  console.log('there was a clientError: %s', error.message());
});

server.on('uncaughtException', (error) => {
  console.log('there was an excepton: %s', error.message());
});
