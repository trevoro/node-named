var named = require('../lib');

if (require.cache[__dirname + '/helper.js'])
        delete require.cache[__dirname + '/helper.js']
var helper = require('./helper');

var dnsBuffer = require('./dnsbuffer');

var test = helper.test;
var protocol = named.Protocol;

for (var i in dnsBuffer.samples) {
    var sample = dnsBuffer.samples[i];
    test('protocol decode/encode: ' + sample.description, (t) => {
        var decoded = protocol.decode(sample.raw, sample.type);
        var encoded = protocol.encode(decoded.val, sample.type);
        if (dnsBuffer.equalBuffers(encoded, sample.raw)) 
            t.ok(true, 'encoder cycle passed');
        else 
            t.ok(false, 'encoder cycle failed');
        t.end();
    });
};