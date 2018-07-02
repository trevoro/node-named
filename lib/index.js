var fs = require('fs');
var path = require('path');

var bunyan = require('bunyan');

var Server = require('./server');
var Query = require('./query');
var Protocol = require('./protocol');

////--- Globals

var BUNYAN_SERIALIZERS = {
    err: bunyan.stdSerializers.err,
    query: (q) => {
        return ({
            domain: q.name(),
            operation: q.operation(),
            type: q.type()
        });
    }
};

///--- Exports

module.exports = {
    createServer: (options) => {
        options = options || {};
        if (typeof (options) !== 'object')
            throw new TypeError('options (object) required');

        var opts = {
            name: options.name || 'named',
            log: options.log || bunyan.createLogger({
                name: 'named',
                level: 'warn',
                serializers: BUNYAN_SERIALIZERS
            })
        };
        return new Server(opts);
    },

    Query: Query,
    Protocol: Protocol,
    bunyan: { serializers: BUNYAN_SERIALIZERS }
};

// Export all the record types at the top-level
var subdir = path.join(__dirname, 'records');
fs.readdirSync(subdir).forEach((f) => {
    var name = path.basename(f);
    if (/\w+\.js/.test(name)) {
        var k = name.split('.').shift().toUpperCase() + 'Record';
        module.exports[k] = require(path.join(subdir, f));
    }
});

// [
//         'A',
//         'MX',
//         'SOA',
//         'SRV',
//         'TXT',
//         'AAAA',
//         'CNAME'
// ].forEach(function (r) {
//         var lcr = r.toLowerCase();
//         var k = lcr.charAt(0).toUpperCase() + lcr.slice(1) + 'Record';
//         module.exports[k] = require(path.join(__dirname, 'records/' + lcr))[r];
// });