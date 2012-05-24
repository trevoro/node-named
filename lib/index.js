var Server = require('./server');
var Query = require('./query');
var Protocol = require('./protocol');
var Logger = require('bunyan');
var path = require('path');

var defaultLogger = new Logger({name: 'named', level: 'info'});

module.exports = {
  createServer: function(options) {
    if (!options) 
      options = {};
    if (!options.name) 
      options.name = 'namedjs';
   
   	if (!options.log) 
			options.log = defaultLogger;

    return new Server(options);
  },
  Query: Query,
  Protocol: Protocol
};

var RECORDS = [
  'A',
  'MX',
  'SOA',
  'SRV',
  'TXT',
  'AAAA',
  'CNAME'
];

for (var i in RECORDS) {
	var lc = RECORDS[i].toLowerCase();
	var key = lc.charAt(0).toUpperCase() + lc.slice(1) + 'Record';

	module.exports[key] = require(path.join(__dirname, 'records/' + lc))[RECORDS[i]];
}
