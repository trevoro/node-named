var named = require('../lib/index');
var cluster = require('cluster');

/*
  <div>
  Example that uses cluster (http://nodejs.org/api/cluster.html) to 
  spin up multiple workers to handle requests.
  </div>
 
  <div>
  You can test it like this: dig @localhost -p 9999 goodtimes.com
  </div>
 
  <div>
  Or using dnsperf:
  </div>
 
  <pre>
  $ echo "goodtimes.com A" > /tmp/f
  $ dnsperf -s localhost -p 9999 -d /tmp/f -l 300
  </pre>
 
  <div>
  Unfortunately the surprise is that more workers (4) run slower (3711 qps),
  than a single worker (4084 qps).
  </div>
 
  @author Brian Hammond
 */
const port = 9999;
const listen = '127.0.0.1';
var scaling = 1;

if (cluster.isMaster) {
    var numCPUs = require('os').cpus().length;
    var workers = numCPUs * this.SCALING;

    console.log('there are numCPUs:' + numCPUs + ', starting ' + workers + ' workers');

    for (var i = 0; i < workers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died, ${code}, ${signal}`);
    });
}

function smrandom() {
    var r = () => { return Math.floor(Math.random() * 252 + 1) };
    return r() + '.' + r() + '.' + r() + '.' + r();
}

if (cluster.isWorker) {
    var server = named.createServer();

    server.listen(port, listen, () => {
        console.log(`DNS worker started on ${listen}:${port}, pid: ${cluster.worker.process.pid}`);
    });

    server.on('query', (query) => {
        var domain = query.name();
        var ttl = 0;
        query.addAnswer(domain, new named.SOARecord(domain, { serial: 12345 }, ttl));
        query.addAnswer(domain, new named.ARecord(smrandom(), ttl));
        server.send(query);
    });
}