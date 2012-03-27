#!/usr/bin/env node

var Logger = require('bunyan')
var named = require('./lib/index');
//var log = new Logger({name: 'namedjs', level: 'debug'});

var agent = named.createAgent();
agent.bind('udp4', 9999);
