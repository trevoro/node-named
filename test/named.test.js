var named = require('../lib');
var dig = require('./dig');

if (require.cache[__dirname + '/helper.js'])
        delete require.cache[__dirname + '/helper.js']
var helper = require('./helper');

///--- Globals

var test = helper.test;
var before = helper.before;
var after = helper.after;

var options = {
    port: 9999,
    server: '::1'
};

///--- Tests

before((callback) => {
    this.server = named.createServer({
        log: helper.getLog('server')
    });

    this.server.on('query', (query) => {
        var domain = query.name()
        var type = query.type();

        switch (type) {
            case 'A':
                var record = new named.ARecord('127.0.0.1');
                query.addAnswer(domain, record);
                break;
            case 'AAAA':
                var record = new named.AAAARecord('::1');
                query.addAnswer(domain, record);
                break;
            case 'CNAME':
                var record = new named.CNAMERecord('cname.example.com');
                query.addAnswer(domain, record);
                break;
            case 'NS':
                var record = new named.NSRecord('ns.example.com');
                query.addAnswer(domain, record);
                break;
            case 'MX':
                var record = new named.MXRecord('smtp.example.com');
                query.addAnswer(domain, record);
                break;
            case 'SOA':
                var record = new named.SOARecord('example.com');
                query.addAnswer(domain, record);
                break;
            case 'SRV':
                var record = new named.SRVRecord('sip.example.com', 5060);
                query.addAnswer(domain, record);
                break;
            case 'TXT':
                var record = new named.TXTRecord('hello world');
                query.addAnswer(domain, record);
                break;
        }
        query.respond();
    });

    this.server.listen(options.port, options.server, () => {
        process.nextTick(callback);
    });
});

after((callback) => {
    this.server.close(callback);
});

test('listen and close (port only)', (t) => {
    // don't conflict with the server made in 'before'
    var server = named.createServer();
    server.listen(1153, () => {
        process.nextTick(() => {
            server.close(() => {
                t.end();
            })
        });
    });
});

test('listen and close (port and ::1)', (t) => {
    var server = named.createServer();
    server.listen(String(1153), '::1', () => {
        process.nextTick(() => {
            server.close(() => {
                t.end();
            })
        });
    });
});

test('answer query: example.com (A)', (t) => {
    dig('example.com', 'A', options, (err, results) => {
        t.ifError(err);
        t.deepEqual(results.answers, [{
            name: 'example.com.',
            ttl: 5, type: 'A',
            target: '127.0.0.1'
        }]);
        t.end();
    });
});

test('answer query: example.com (AAAA)', (t) => {
    dig('example.com', 'AAAA', options, (err, results) => {
        t.ifError(err);
        t.deepEqual(results.answers, [{
            name: 'example.com.',
            ttl: 5, type: 'AAAA',
            target: '::1'
        }]);
        t.end();
    });
});

test('answer query: example.com (CNAME)', (t) => {
    dig('www.example.com', 'CNAME', options, (err, results) => {
        t.ifError(err);
        t.deepEqual(results.answers, [{
            name: 'www.example.com.',
            ttl: 5,
            type: 'CNAME',
            target: 'cname.example.com.'
        }]);
        t.end();
    });
});

test('answer query: example.com (NS)', (t) => {
    dig('example.com', 'NS', options, (err, results) => {
        t.ifError(err);
        t.deepEqual(results.answers, [{
            name: 'example.com.',
            ttl: 5,
            type: 'NS',
            target: 'ns.example.com.'
        }]);
        t.end();
    });
});

test('answer query: example.com (MX)', (t) => {
    dig('example.com', 'MX', options, (err, results) => {
        t.ifError(err);
        t.deepEqual(results.answers, [{
            name: 'example.com.',
            ttl: 5,
            type: 'MX',
            target: '0 smtp.example.com.'
        }]);
        t.end();
    });
});

test('answer query: example.com (SOA)', (t) => {
    dig('example.com', 'SOA', options, (err, results) => {
        t.ifError(err);
        t.deepEqual(results.answers, [{
            name: 'example.com.',
            ttl: 5,
            type: 'SOA',
            target: 'example.com. hostmaster.example.com. 0 10 10 10 10'
        }]);
        t.end();
    });
});

test('answer query: example.com (SRV)', (t) => {
    dig('_sip._tcp.example.com', 'SRV', options, (err, results) => {
        t.ifError(err);
        t.deepEqual(results.answers, [{
            name: '_sip._tcp.example.com.',
            ttl: 5,
            type: 'SRV',
            target: '0 10 5060 sip.example.com.'
        }]);
        t.end();
    });
});

test('answer query: example.com (TXT)', (t) => {
    dig('example.com', 'TXT', options, (err, results) => {
        t.ifError(err);
        t.deepEqual(results.answers, [{
            name: 'example.com.',
            ttl: 5,
            type: 'TXT',
            target: '"hello world"'
        }]);
        t.end();
    });
});