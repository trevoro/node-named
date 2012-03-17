var assert = require('assert');
var dgram = require('dgram');
var util = require('util');
var message = require('./message');


var Agent = function(options) {
	var self = this;

	if (typeof(options) !== 'object') {
		throw new TypeError('options (object) is required');
	}

	this._log = options.log;
	this._name = options.name || "namedjs";

}

Agent.prototype._send_response = function _send_response(res) {
	var sock;

	res.encode();

	this._log.debug("Sending DNS response message to %s:%s", res.dst.address, res.dst.port);
	//sock = dgram.createSocket(res.dst.family);
	//sock.send(res.raw.buf, 0, res.raw.len, res.dst.port, res.dst.address);
	this.connection.send(res.raw.buf, 0, res.raw.len, res.dst.port, res.dst.address);
};

Agent.prototype._process_req = function _process_req(req) {
	var rsp;

	this._log.debug(req);
	
	rsp = message.createMessage(req);
	rsp.dst = req.src;

	this._log.debug("Processing request");
	//XXX do something
	
	this._send_response(rsp);
}

Agent.prototype._recv = function _recv(raw, src) {
	var req;

	/*
	try {
		req = message.parseMessage(raw, src);
	} 
	catch (err) {
		this._log.debug("Received malformed DNS packet");
		//XXX return invalid packet response
	}
	*/

	req = message.parseMessage(raw, src);
	this._process_req(req, src);
};

Agent.prototype.bind = function bind(family, port) {
	var self = this;

	this.connection = dgram.createSocket(family);
	this.connection.on('message', function(msg, rinfo) {
		var raw = {
			buf: msg,
		  len: rinfo.size
	  };
    var src = {
			family: family,
		  address: rinfo.address,
		  port: rinfo.port
	  };
  
	  self._recv(raw, src);
	});

  this.connection.on('listening', function() {
		self._log.debug("server started on %s:%s", family, port);
	});
  this.connection.bind(port);
};

module.exports = Agent
