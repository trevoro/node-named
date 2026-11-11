'use strict';

const bunyan = require('bunyan');

const Server = require('./server');
const Query = require('./query');
const Protocol = require('./protocol');


///--- Globals

const BUNYAN_SERIALIZERS = {
  err: bunyan.stdSerializers.err,
  query: function serializeQuery(q) {
    return {
      domain: q.name(),
      operation: q.operation(),
      type: q.type()
    };
  }
};


///--- Exports

module.exports = {

  createServer: function createServer(options) {
    options = options || {};
    if (typeof (options) !== 'object')
      throw new TypeError('options (object) required');

    return new Server({
      name: options.name || 'named',
      log: options.log || bunyan.createLogger({
        name: 'named',
        level: 'warn',
        serializers: BUNYAN_SERIALIZERS
      })
    });
  },

  Query: Query,

  Protocol: Protocol,

  bunyan: { serializers: BUNYAN_SERIALIZERS },

  // All the record types are exported at the top-level
  ARecord: require('./records/a'),
  AAAARecord: require('./records/aaaa'),
  CNAMERecord: require('./records/cname'),
  MXRecord: require('./records/mx'),
  NSRecord: require('./records/ns'),
  SOARecord: require('./records/soa'),
  SRVRecord: require('./records/srv'),
  TXTRecord: require('./records/txt')

};
