var Agent = require('./agent');
var message = require('./message');
var protocol = require('./protocol');
var Logger = require('bunyan');

//XXX fix me
var defaultLogger = new Logger({name: 'namedjs', level: 'trace'});

module.exports = {
	createAgent: function(options) {
		if (!options) 
			options = {};
		if (!options.name) 
			options.name = 'namedjs';
    
    options.log = defaultLogger;
		return new Agent(options);
	},
	message: message,
	protocol: protocol
};
