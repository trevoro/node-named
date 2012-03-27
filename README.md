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

To create a DNS server simply require 'node-named'. 

## Supported Record Types

The following record types are supported

 * A (ipv4)
 * AAAA (ipv6)
 * CNAME (aliases)
 * SOA (start of authority)
 * MX (mail server records)

## TODO

 * Add support for:
  - PTR   
  - TXT
  - SRV
  - AXFR requests (and tcp listener)

 * Add query recurser
