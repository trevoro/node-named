'use strict';

/**
 * Example that uses cluster (http://nodejs.org/api/cluster.html) to
 * spin up multiple workers to handle requests.
 *
 * You can test it like this: dig @localhost -p 9999 goodtimes.com
 *
 * Or using dnsperf:
 *
 *   $ echo "goodtimes.com A" > /tmp/f
 *   $ dnsperf -s localhost -p 9999 -d /tmp/f -l 300
 *
 * Unfortunately the surprise is that more workers (4) run slower (3711 qps),
 * than a single worker (4084 qps), so a single worker is started by default.
 * Set WORKERS to start more of them.
 *
 * Note that this does not run on Windows, where Node.js can not share a UDP
 * socket between the workers of a cluster (it fails with ENOTSUP).
 *
 * @author Brian Hammond
 */

const cluster = require('cluster');

const named = require('../lib');

const PORT = 9999;
const LISTEN = '127.0.0.1';
const WORKERS = Number(process.env.WORKERS) || 1;
const TTL = 0;

function randomOctet() {
  return Math.floor(Math.random() * 252 + 1);
}

function randomAddress() {
  return randomOctet() + '.' + randomOctet() + '.' + randomOctet() + '.' +
    randomOctet();
}

function primary() {
  console.log('starting %d workers', WORKERS);

  for (let i = 0; i < WORKERS; i++)
    cluster.fork();

  cluster.on('exit', (worker) => {
    console.log('worker %d died', worker.process.pid);
  });
}

function worker() {
  const server = named.createServer();

  server.listen(PORT, LISTEN, () => {
    console.log('DNS worker started on %s:%d, pid:%d', LISTEN, PORT,
                process.pid);
  });

  server.on('query', (query) => {
    const domain = query.name();
    query.addAnswer(domain, new named.SOARecord(domain, {serial: 12345}), TTL);
    query.addAnswer(domain, new named.ARecord(randomAddress()), TTL);
    server.send(query);
  });
}

if (cluster.isPrimary)
  primary();
else
  worker();
