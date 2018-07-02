var validators = require('../lib/validators');

if (require.cache[__dirname + '/helper.js'])
        delete require.cache[__dirname + '/helper.js']
var helper = require('./helper');

var test = helper.test;

var toTest = {
    nsName: [
        ['example.com', true],
        ['0example.com', true],
        ['_example.com', false],
        ['0_example.com', false],
        ['-example.com', false],
        ['0-example.com', true],
        ['example-one.com', true],
        ['example-111.com', true],
        ['Example-111.com', true],
        ['a name with spaces', false],
    ],
    UInt32BE: [
        ['hello', false],
        ['12345', true],
        [4294967296, false],
        [10, true]
    ],
    UInt16BE: [
        ['hello', false],
        ['12345', true],
        [65536, false],
        [10, true]
    ],
    nsText: [
        ['hello world', true],
    ]
};

test('testing validator (nsName)', (t) => {
    var k = 'nsName';
    for (var i in toTest.k) {
        var s = toTest.k[i][0];
        var ok = toTest.k[i][1];
        var result = validators.k(s);
        t.equal(result, ok);
    }
    t.end();
});

test('testing validator (UInt32BE)', (t) => {
    var k = 'UInt32BE';
    for (var i in toTest.k) {
        var s = toTest.k[i][0];
        var ok = toTest.k[i][1];
        var result = validators.k(s);
        t.equal(result, ok);
    }
    t.end();
});

test('testing validator (UInt16BE)', (t) => {
    var k = 'UInt16BE';
    for (var i in toTest.k) {
        var s = toTest.k[i][0];
        var ok = toTest.k[i][1];
        var result = validators.k(s);
        t.equal(result, ok);
    }
    t.end();
});

test('testing validator (nsText)', (t) => {
    var k = 'nsText';
    for (var i in toTest.k) {
        var s = toTest.k[i][0];
        var ok = toTest.k[i][1];
        var result = validators.k(s);
        t.equal(result, ok);
    }
    t.end();
});