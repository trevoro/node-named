var assert = require('assert');
var dgram = require('dgram');
var util = require('util');
var Logger = require('bunyan');
var Query = require('./query');
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
  var message;
  
  res._flags.qr = 1; 

  res.encode();

  this._log.debug("Sending DNS response message to %s:%s", 
      res.dst.address, res.dst.port);
  
  this._socket.send(res.raw.buf, 0, res.raw.len, 
      res.dst.port, res.dst.address);
};

Server.prototype.listen = function (port, address, onListen) {
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

    var decoded = Query.parse(raw, src);
    var query = Query.createQuery(decoded);
   
    self.emit('query', query); 

  });

  this._socket.on('listening', function() {
    self.emit('listening');
    
    if (onListen) 
      return onListen(null);
  });

  this._socket.bind(port, address);
};

module.exports = Server
