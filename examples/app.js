'use strict';

const named = require('../lib');

const PORT = 9999;
const server = named.createServer();

server.listen(PORT, '127.0.0.1', () => {
  console.log('DNS server started on port %d', PORT);
});

server.on('query', (query) => {
  const domain = query.name();
  const record = new named.SOARecord(domain, {serial: 12345, ttl: 300});
  query.addAnswer(domain, record, 300);
  server.send(query);
});
