---
title: API | node-named
---

# node-named

node-named is a lightweight DNS server written in javascript. It implements
commonly used functionality from a variety of DNS RFC specifications. Unlike
many other DNS servers node-named does not attempt to manage DNS records for
you. You simply get a request, build your response based on whatever criteria
you desire, and then send that response back to the client.

## Seriously?  

Actually this is quite useful. Both BIND and PowerDNS assume that records never
change, and are not designed to be manipulated using an API or have elegant
pluggable storage mechanisms. This DNS server is good for creating services
where your records may change frequently, or you would like to access records 
stored in a central system using a mechanism of your choosing. 

# Installation

`$ npm install named`

# Server API

```js
var named = require('./lib/index');
var server = named.createServer();

server.listen(9999, '127.0.0.1', function() {
  console.log('DNS server started on port 9999');
});

server.on('query', function(query) {
  var domain = query.name();
  var target = new named.SOARecord(domain, {serial: 12345});
  // 300 is the ttl for this record
  query.addAnswer(domain, target, 300);
  server.send(query);
});
```

Hit this DNS server with `dig` to see some results. Because we are only 
handling DNS responses for one record type (SOA or 'Start of Authority'), that 
is the response we will see, regardless of the type we make a request for. Dig
is nice about this.
```
$ dig @localhost -p9999 example.com SOA

; <<>> DiG 9.7.3-P3 <<>> @localhost -p9999 example.com SOA
; (3 servers found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 32739
;; flags: qr rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0
;; WARNING: recursion requested but not available

;; QUESTION SECTION:
  ;example.com.   IN  SOA

;; ANSWER SECTION:
  example.com.5   IN  SOA example.com. hostmaster.example.com. 12345 10 10 10 10

;; Query time: 10 msec
;; SERVER: ::1#9999(::1)
;; WHEN: Wed May 23 19:24:09 2012
;; MSG SIZE  rcvd: 109
```

## Named API

### named.createServer([options])

Create a new named server.

options is an object which may specify:

- log: an optional bunyan logger
- name: an optional name used to identify the server

Here is an example a named server listening on port 53
```js
var named = require('named');

var server = named.createServer({
  name: 'named0'
});

server.listen(53);
```

## Class: named.Server

### server.listen(port, [host], [onListen])

Start accepting connections on the specified `port` and `host`.
If the host is ommited then it will listen on all IPv4 and IPv6 interfaces.

This function is asyncronous. Whenever the server is litening a `listen` event
will be emitted. The last parameter `onListen` will be executed but not attached
to the listen event, when the server is listening.

### server.send(queryResponse)

Sends a `queryResponse` message. The queryResponse includes information about
the client in the object itself. The `send` function will encode the message 
and send the response to the appropriate client. Unsolicited DNS messages are 
not permitted. This function should only be used within the `query` event.

**Note** If you do not add any answers to your query, then the `send()` method
will send a 'null-response' DNS message. This is the equivalent of an HTTP 404.

### server.close(onClose)

Stops listening and closes the socket. `onClose` is an optional callback that
will be attached to the underlying socket `close` event.

### Event: 'listening'

`function() { }`

Emitted once, when the server starts listening on the specified `port` and 
`host`

### Event: 'query'

`function (query) { }`

Emitted each time there is valid request. `query` is an instance of 
`named.Query`

### Event: 'clientError'

`function (error) { }`

Emitted when there is an invalid DNS request. This may be caused by a bad UDP
datagram, or some other malformed DNS request. Parser errors are not included
here. 

`error` is an instance of `named.DnsError` 

### Event: 'uncaughtException'

`function (error) { }`

Emitted when there is an uncaught exception somewhere in the protocol stack.

`error` is an instance of `named.DnsError` 

### Event: 'after'

`function (query, bytes)`

Emitted after a `query` is sent to a client. This can be used for logging
purposes.

`query` is an instance of `named.Query` 
`bytes` is the number of bytes sent over the wire to the client

## Class: named.Query

A query message is emitted by the `query` event. Query messages include all of
the information about the query from the Client, including the client details.
Because DNS queries are UDP based, the entire query itself is echoed back onto
the wire, with the answer appended to its appropriate 'answer' fields. Several
headers are changed, but the query is the same.

For this reason, you 'reflect' the modified query back to the client. Prior to
doing this you can check the 'Question' and 'Type' of question and perform an
appropriate lookup & generate an appropriate response.

### query.name()

Returns a string containing the query question name. This may be a hostname, but
depends on the type

### query.type()

Returns a string containing the type code for the query question.

### query.answers()

Returns an array of answers that have been added to the query

### query.addAnswer(name, record, ttl)

Add an instances of `named.Record` to the query.
Name is the name you want to respond with (in 99.99% of cases, the
query.name()), record is the record instance, and type is the type of record you
are responding with. In most cases this will be what the query.type() returns,
but for instances like an 'A' or 'AAAA' request you may elect to respond with a
CNAME record. 

### query.operation()

Returns the type of operation that the client is requesting. In almost all cases
this will be 'query'. Valid operations are 'query', 'status', 'notify', and
'update'.

### query.encode()

Encodes the query and stores the results as a `buffer` in the query itself.
This function should never need to be invoked, as the `server.send` function
will automatically encode a query prior to being sent to the client.


## Records

A DNS query is a question posed to a server about a record for a specific 
domain. The questions are for specific 'types' of records. Of the types listed
in all of the DNS RFCs only some are still in use, and even fewer are 
frequently used. Each type of request has an appropriate response, each of 
which have different formats. These response formats are known as 
"Resource Records" or for the sake of named, just 'Records'. 

All records in named are created using the `new` keyword.

### named.SOARecord(domain, [options])

Create a DNS 'Start of Authority' record

Options:

- `admin`: The DNS name formatted email address of the administrator for this
  domain. Defaults to 'hostmaster.[domain]'
- `serial`: The serial number of this domain. Defaults to 0
- `refresh`: The refresh interval for this domain. Defaults to 10
- `retry`: The retry interval for this domain. Defaults to 10
- `expire`: The expire interval for this domain. Defaults to 10
- `ttl`: The default time-to-live for records in this domain. Defaults to 10

### named.ARecord(ipv4Addr)

Create an IPv4 resource record
`ipv4Addr` must be a valid IPv4 address (string).

### named.AAAARecord(ipv6Addr)

Create an IPv6 resource record.
`ipv6Addr` must be a valid IPv6 address (string).

### named.CNAMERecord(target)

Create an Alias record. When these records are sent to the client, the client
will often make an additional request for the alias itself.

### named.MXRecord(exchange, options)

Create a Mail Server record. A client making this request will often make an
additional request for the entries in these records.
`exchange` is the name of the mailserver that handles mail for this domain.

Options:
- `ttl`: The time-to-live for this particular mail server record
- `priority`: The priority of this mailserver over other mailservers. You may
  have multiple mail servers. Lowest priority server is selected by client.

### named.SRVRecord(target, port, options)

Create a Server Resource record.
`target` is the name of the server that handles this particular resource name
`port` is the tcp/udp port where the service may be reached

Options:
- `weight`: Used by the client for selecting between multiple results. Higher
  weight wins. Default is 10
- `priority`: Used by the client for selecting between mutiple results. Higher
  priortiy wins. Default is 10
  
### named.TXTRecord(target)

Create a text resource record.
`target` can be any text up to 500 bytes in length

## Class: named.Record

### record.valid()

This function will ensure that the data you used to create the record is in fact
valid.

## DnsError

DnsErrors rae objects that consist of:
- `code`: A unique error number
- `name`: the name of the error

DnsErrors are:

- `NoError` 
- `ProtocolError`
- `CannotProcessError` 
- `NoNameError`
- `NotImplementedError`
- `RefusedError`
- `ExceptionError`

## Class: named.DnsError

### error.message()

Returns the message that was passed in to the error. The message is a string,
and can be used for logging purposes

<!--## Server Properties>

