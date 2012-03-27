#!/usr/bin/env node

var named = require('./lib/index');
var agent = named.createAgent();
agent.bind('udp4', 9999);
agent.bind('udp6', 9999);
