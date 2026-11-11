'use strict';

const named = require('../lib');

const PORT = 9999;
const server = named.createServer();

server.listen(PORT, '127.0.0.1', () => {
  console.log('DNS server started on port %d', PORT);
});

server.on('query', (query) => {
  console.log('DNS Query: (%s) %s', query.type(), query.name());
  // If we do not add any answers to the query then the
  // result will be a 'null-answer' message. This is how
  // you send a "404" to a DNS client
  server.send(query);
});

server.on('clientError', (error) => {
  console.log('there was a clientError: %s', error.message());
});

server.on('uncaughtException', (error) => {
  console.log('there was an excepton: %s', error.message());
});
