#!/usr/bin/env node

var Logger = require('bunyan')
var named = require('./lib/index');

var log = new Logger({name: 'namedjs', level: 'trace'});

var agent = named.createAgent({log: log});
agent.bind('udp4', 9999);
