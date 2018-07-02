var named = require('../lib');
var dnsBuffer = require('./dnsbuffer');

if (require.cache[__dirname + '/helper.js'])
        delete require.cache[__dirname + '/helper.js'];
var helper = require('./helper');

var test = helper.test;
var before = helper.before;
var after = helper.after;

var raw,
    src;

before((callback) => {
    try {
        raw = {
            buf: dnsBuffer.samples[0].raw,
            len: dnsBuffer.samples[0].length
        }
        src = {
            family: 'udp6',
            address: '127.0.0.1',
            port: 23456
        }

        process.nextTick(callback);
    }
    catch (e) {
        console.error(e.stack);
        process.exit(1);
    }
});

test('decode a query datagram', (t) => {
    var query = named.Query.parse(raw, src);
    t.end();
});

test('create a new query object', (t) => {
    var decoded = named.Query.parse(raw, src);
    var query = named.Query.createQuery(decoded);
    t.end();
});

test('encode an null-response query object', (t) => {
    var decoded = named.Query.parse(raw, src);
    var query = named.Query.createQuery(decoded);
    query.encode();
    var ok = dnsBuffer.samples[0].raw;
    t.deepEqual(query._raw.buf, ok);
    t.end();
});

// TODO: test adding a record
// TODO: test name response
// TODO: test answers response