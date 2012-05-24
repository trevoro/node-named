var assert = require('assert');
var dgram = require('dgram');
var util = require('util');
var Logger = require('bunyan');
var Query = require('./query');
var DnsError = require('./errors');
var EventEmitter = require('events').EventEmitter;

var Server = function(options) {
  var log, self = this;

  if (typeof(options) !== 'object') {
    throw new TypeError('options (object) is required');
  }

  this._log = options.log.child({component: 'agent'});
  this._name = options.name || "named";
  this._socket = null;

}

Server.prototype = Object.create(EventEmitter.prototype);


Server.prototype.send = function (res) {
  var self = this;
  
  res._flags.qr = 1; 

  res.encode();

  this._log.debug("Sending DNS response message to %s:%s", 
    res._client.address, res._client.port);
  
  this._socket.send(
    res._raw.buf, 
    0, 
  	res._raw.len, 
    res._client.port, 
    res._client.address, 
    function(err, bytes) {
    	if (err) {
    		self.emit('uncaughtException', new DnsError.ExceptionError('unable to send response'));
    	}
			else {
				self.emit('after', res, bytes);
			}
  });

  
};

Server.prototype.listen = function (port, address, onListen) {
  if (!port)
  	throw new TypeError('port (number) is required');

  if (typeof(address) === 'function') {
  	onListen = address;
  	address = '0.0.0.0';
  }

  var self = this;

  this._socket = dgram.createSocket('udp6');
  this._socket.on('message', function(buffer, rinfo) {
    
    var raw = {
      buf: buffer,
      len: rinfo.size
    };

    var src = {
      family: 'udp6',
      address: rinfo.address,
      port: rinfo.port
    };

		try {
			var decoded = Query.parse(raw, src);
			
			try {
				var query = Query.createQuery(decoded);
				self.emit('query', query); 
			}
			catch (e) {
				self.emit('uncaughtException',
						new DnsError.CannotProcessError('unable to respond to query'));
			}
		}
		catch (e) {
		  self.emit('clientError', 
		  		new DnsError.ProtocolError('invalid DNS datagram'));
	  }


  });

  this._socket.on('listening', function() {
    self.emit('listening');
    
    if (onListen) 
      return onListen(null);
  });

  this._socket.bind(port, address);
};

module.exports = Server
