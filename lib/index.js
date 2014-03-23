var fs = require('fs');
var path = require('path');

var bunyan = require('bunyan');

var Server = require('./server');
var Query = require('./query');
var Protocol = require('./protocol');



////--- Globals

var BUNYAN_SERIALIZERS = {
        err: bunyan.stdSerializers.err,
        query: function serializeQuery(q) {
                var out = {
                        domain: q.name(),
                        operation: q.operation(),
                        type: q.type()
                };
                return (out);
        }
};



///--- Exports
module.exports = {

        createServer: function createServer(options) {
                options = options || {};
                if (typeof (options) !== 'object')
                        throw new TypeError('options (object) required');


                var opts = {
                        name: options.name || 'named',
                };
                if (typeof (options.log) === 'object') {
                        // An alternative logger has been specified
                        opts.log = options.log
                } else if (typeof (options.log) === 'string') {
                        // A log level has been specified
                        opts.log = bunyan.createLogger({
                                name: 'named',
                                level: options.log,
                                serializers: BUNYAN_SERIALIZERS
                        });
                } else {
                        // No or unrecognised logger has been specified - use default
                        opts.log = bunyan.createLogger({
                                name: 'named',
                                level: 'warn',
                                serializers: BUNYAN_SERIALIZERS
                        });
                }
                return (new Server(opts));
        },

        Query: Query,

        Protocol: Protocol,

        bunyan: { serializers: BUNYAN_SERIALIZERS }

};

// Export all the record types at the top-level
var subdir = path.join(__dirname, 'records');
fs.readdirSync(subdir).forEach(function (f) {
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
