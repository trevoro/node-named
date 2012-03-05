#!/usr/bin/env node

var util = require('util');
var dgram = require('dgram');
var log = require('./lib/log');
var named = require('./lib/named');
var message = require('./lib/message');


// config
var config = {
  host: 'localhost',
  port: 9999
}

var onReceive = function(raw, client) {
  var req;

  try {
    //req = message.parseDNS(raw, client);
    req = named.parse(raw, client);
  }
  catch (error) {
    // XXX respond with error if possible
    // have some counter for errors
    log.debug("error: issue parsing request");

  }

  log.debug("got DNS query");
 
  console.log(req);


  named.buildResponse(req, function(err, raw) {
    server.send(raw, 0, raw.length, client.port, client.address);
  });

}

var server = dgram.createSocket('udp4');

server.on('message', function(msg, rinfo) {
  var raw = {
    buf: msg,
    len: rinfo.size
  };
  var client = {
    family: 'udp4',
    address: rinfo.address,
    port: rinfo.port
  };

  onReceive(raw, client);

});

server.bind(config.port, config.host);
log.info("dns server started on " + config.host + ":" + config.port);
