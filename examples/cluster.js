var named = require('../lib/index');
var cluster = require('cluster');

/**
 *
 * <div>
 * Example that uses cluster (http://nodejs.org/api/cluster.html) to 
 * spin up multiple workers to handle requests.
 * </div>
 *
 * <div>
 * You can test it like this: dig @localhost -p 9999 goodtimes.com
 * </div>
 *
 * <div>
 * Or using dnsperf:
 * </div>
 *
 * <pre>
 * $ echo "goodtimes.com A" > /tmp/f
 * $ dnsperf -s localhost -p 9999 -d /tmp/f -l 300
 * </pre>
 *
 * <div>
 * Unfortunately the surprise is that more workers (4) run slower (3711 qps),
 * than a single worker (4084 qps).
 * </div>
 *
 * @author Brian Hammond
 *
 */
var ClusterDns = function() {

	/* lame config */
	this.PORT = 9999;
	this.LISTEN = '127.0.0.1';
	this.SCALING = 1;

	this.master = function() {
		var numCPUs = require('os').cpus().length;
		var workers = numCPUs * this.SCALING;
		workers = 1;

		console.log( 'there are numCPUs:' + numCPUs + ', starting ' + workers + ' workers' );

		for (var i = 0; i < workers ; i++) {
			cluster.fork();
		}

		cluster.on('exit', function(worker, code, signal) {
			console.log('worker ' + worker.process.pid + ' died');
		});
	}

	this.randumb = function() {
		var r = function() { return Math.floor( Math.random() * 252 + 1 ) };
		return r() + '.' + r() + '.' + r() + '.' + r();
	};

	this.friendo = function() {
		var thiz = this;
		var server = named.createServer();

		var port = this.PORT;
		var listen = this.LISTEN;

		server.listen( port, listen, function() {
			console.log( 'DNS worker started on ' + listen + ':' + port + ', pid:' + cluster.worker.process.pid );
		});

		server.on('query', function(query) {
			var domain = query.name();
			var ttl = 0;
			query.addAnswer( domain, new named.SOARecord(domain, {serial: 12345}, ttl ) );
			query.addAnswer( domain, new named.ARecord( thiz.randumb(), ttl ) );
			server.send(query);
		});
	};

	this.run = function() {
		if ( cluster.isMaster ) {
			this.master();
		} else {
			this.friendo();
		}
	};
};

new ClusterDns().run();
