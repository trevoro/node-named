var Server = require('./server');
var Query = require('./query');
var Protocol = require('./protocol');
var Logger = require('bunyan');
var Record = require('./record');

var defaultLogger = new Logger({name: 'namedjs', level: 'info'});

module.exports = {
  createServer: function(options) {
    if (!options) 
      options = {};
    if (!options.name) 
      options.name = 'namedjs';
    
    options.log = defaultLogger;
    return new Server(options);
  },
  Query: Query,
  Record: Record,
  Protocol: Protocol
};
