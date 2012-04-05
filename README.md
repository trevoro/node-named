# node-named - DNS Server in Node.js

Node-named is a lightweight DNS server written in pure javascript. It has
limited support for the DNS spec, but aims to implement all of the *common*
functionality that is in use today. When DNS was designed it was designed prior
to the web existing, so many of the features in the RFC are either never used,
or were never implemented. This server aims to be RFC compliant, but does not
implement any other protocol other than INET (the one we're all used to), and
only supports a handful of record types (the ones that are in use on a regular
basis).

## Creating a DNS Server

To create a DNS server simply require 'node-named' then create a new server and
bind to your port. You can bind to as many ports as you like. More importantly,
you can bind to both 'udp4', and 'udp6' sockets. For example:

    var named = require('node-named');
    var agent = named.createAgent();
    agent.bind('udp4', 9999);
    agent.bind('udp6', 9999);


## Storing DNS Records

The default server comes with a very simple memory based record storage
mechanism. The goal is that you can implement your own, and pass that in when
you create a new agent. See TODO

## Logging

node-named uses [http://github.com/trentm/node-bunyan](bunyan) for logging.
It's a lot nicer to use if you npm install bunyan and put the bunyan tool in
your path. Otherwise, you will end up with JSON formatted log output by default.

### Replacing the default logger

You can pass in an alternate logger if you wish. If you do not, then it will use
bunyan by default. Your logger must expose the functions 'info', 'debug',
'warn', 'trace', 'error', and 'notice'.

### Supported Record Types

The following record types are supported

 * A (ipv4)
 * AAAA (ipv6)
 * CNAME (aliases)
 * SOA (start of authority)
 * MX (mail server records)
 * TXT (arbitrary text entries)
 * SRV (service discovery)

### TODO

 * Add support for:
  - PTR   
  - DNS query recursion (luckily we can use c-ares for this!)
  - AXFR requests (and tcp listener)

 * Significantly improve record types and break that out of the existing store
   system
 * Modularize store so that it can be extended with custom stores
 * Add support to the store for adding records while the system is up and
   running
 * Add either a pre-processor to prebuild all queries, or
 * Add a cache to store pre-serialized queries. This cache will have to have LRU
   and a triggered deletion (if you delete a record, make sure you delete the
   cache object)
 * Add child components for logging
