var assert = require('assert');
var dgram = require('dgram');
var util = require('util');
var message = require('./message');
var store = require('./store');


var Agent = function(options) {
	var self = this;

	if (typeof(options) !== 'object') {
		throw new TypeError('options (object) is required');
	}

	this._log = options.log;
	this._name = options.name || "namedjs";
	this._store = store.createStore({dbFile: './db/test.db'});
	this._store._load();

}

Agent.prototype._send_response = function _send_response(res) {
	var sock;

	res.encode();

	this._log.debug("Sending DNS response message to %s:%s", res.dst.address, res.dst.port);
	this.connection.send(res.raw.buf, 0, res.raw.len, res.dst.port, res.dst.address);
};

Agent.prototype._process_req = function _process_req(req) {
	var rsp, query = {};

	this._log.debug(req);
	
	rsp = message.createMessage(req);
	rsp.dst = req.src;
	this._log.debug("Processing request");

  this._log.debug("question - name: %s", rsp.question.name);

  var results = this._store.get(rsp.question);
  if (results.error) {
  	this._log.error("error looking up record");
	}

	rsp._answers = results.records
	this._send_response(rsp);

}

Agent.prototype._recv = function _recv(raw, src) {
	var req;

	try {
		req = message.parseMessage(raw, src);
	} 
	catch (err) {
		this._log.debug("Received malformed DNS packet");
		//XXX return invalid packet response
	}

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
