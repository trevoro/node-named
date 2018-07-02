var named = require('../lib');

if (require.cache[__dirname + '/helper.js'])
        delete require.cache[__dirname + '/helper.js']
var helper = require('./helper');

var test = helper.test;

var testRecord = (record, t) => {
    if (!record)
        t.ok(false, 'record could not be created');

    if (record && record.valid()) 
        t.ok(true, 'valid record created');
    else 
        t.ok(false, 'record was not valid');

    t.end()
}

test('create a valid record (A)', (t) => {
    var record = new named.ARecord('127.0.0.1');
    testRecord(record, t);
});

test('create a valid record (AAAA)', (t) => {
    var record = new named.AAAARecord('::1');
    testRecord(record, t);
});

test('create a valid record (CNAME)', (t) => {
    var record = new named.CNAMERecord('alias.example.com');
    testRecord(record, t);
});

test('create a valid record (NS)', (t) => {
    var record = new named.NSRecord('ns.example.com');
    testRecord(record, t);
});

test('create a valid record (MX)', (t) => {
    var record = new named.MXRecord('smtp.example.com');
    testRecord(record, t);
});

test('create a valid record (SOA)', (t) => {
    var record = new named.SOARecord('example.com');
    testRecord(record, t);
});

test('create a valid record (SRV)', (t) => {
    var record = new named.SRVRecord('_sip._udp.example.com', 5060);
    testRecord(record, t);
});

test('create a valid record (TXT)', (t) => {
    var record = new named.TXTRecord('hello world');
    testRecord(record, t);
});