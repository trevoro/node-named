var assert = require('assert');
var dgram = require('dgram');
var util = require('util');
var message = require('./message');
var store = require('./store');
var Logger = require('bunyan');

var Agent = function(options) {
  var log, self = this;

  if (typeof(options) !== 'object') {
    throw new TypeError('options (object) is required');
  }


  this._log = options.log.child({component: 'agent'});
  //|| new Logger({name: 'named', level: 'info'});
  this._name = options.name || "named";
  this._store = options.store || store.create({dbFile: '../db/test.db', log: options.log});
  this._store._load();

}

Agent.prototype._send_response = function _send_response(res) {
  var sock;

  res._flags.qr = 1;
  res.encode();

  this._log.debug("Sending DNS response message to %s:%s", res.dst.address, res.dst.port);
  this.connection.send(res.raw.buf, 0, res.raw.len, res.dst.port, res.dst.address);
};

Agent.prototype._process_req = function _process_req(req) {
  var rsp, query = {};

  this._log.trace(req);
  
  rsp = message.createMessage(req);
  rsp.dst = req.src;
  this._log.debug("Processing request");

  this._log.debug("question - name: %s", rsp.question.name);

  var results = this._store.get(rsp.question);
  if (results.error) {
    var error = results.error;
    this._log.error(JSON.stringify(error.message));
    //XXX send error message
    rsp._answers = [];
    rsp._error = error;
    rsp._flags.rcode = error.code; 
  } 
  else {
    rsp._answers = results.records
  }

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
    self._log.info("server started on %s:%s", family, port);
  });
  this.connection.bind(port);
};

module.exports = Agent
