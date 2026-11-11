# Njord NS Server 2.0.0

This release modernizes the codebase, updates every dependency, and makes
encoding a response several times faster. The exported API is unchanged, but
the minimum Node.js version is raised and a number of bugs are fixed in ways
that callers can observe, hence the new major version.

## Requirements

Node.js 20 or newer (was 0.6).

## Upgrading from 1.x

No code changes are needed for most users: the exports, method signatures and
events are the same, and `error.message()` is still a function. Check the list
of behaviour changes below if you relied on any of the old behaviour.

## Dependencies

| Package   | 1.0.1 | 2.0.0   |
|-----------|-------|---------|
| bunyan    | 0.7.0 | 1.8.15  |
| ipaddr.js | 0.1.1 | 2.5.0   |
| nodeunit  | 0.9.0 | removed |

The tests now use the test runner that is built into Node.js, so there are no
development dependencies, and `dig` is no longer needed to run them.

## Performance

A response is written in a single pass into one buffer, instead of one small
buffer per field. Names are compressed with DNS pointers (RFC 1035 4.1.4), so
responses are smaller as well.

Parsing a query and encoding its response, measured on one machine:

| Response | 1.0.1 (ops/s) | 2.0.0 (ops/s) | Size (bytes) |
|----------|---------------|---------------|--------------|
| A        | 53k           | 236k          | 62 → 48      |
| AAAA     | 41k           | 144k          | 74 → 60      |
| SOA      | 44k           | 234k          | 113 → 79     |
| 4 × MX   | 21k           | 118k          | 208 → 112    |

This is a micro-benchmark of the protocol code, not of network throughput.

## Behaviour changes

- `record.valid()` validates the record. It used to return `true` for
  everything.
- `query.addAnswer(name, record, 0)` sends a TTL of 0. It used to be replaced
  by the default of 5.
- `server.listen(port, '::1')` listens on IPv6. A UDP4 socket used to be
  opened whatever the address was.
- The address family of the client of a query is the real one. It used to be
  reported as `udp6` for every client.
- The counts in the header of a response describe what is sent. A query with
  EDNS options used to get a response that announced an additional record
  which was not there.
- The opcode of a query is decoded correctly, so `query.operation()` works for
  status, notify and update messages.
- Names with a trailing dot, and the root name, are encoded correctly.
- TXT records longer than 255 bytes are split into several strings.
- The constructors of the records leave the options that are passed to them
  alone.
- Invalid addresses and names are rejected when the response is encoded, which
  is reported with the `uncaughtException` event of the server.

## Other changes

- `lib/` is written with classes and in strict mode, and no longer leaks
  global variables.
- The examples listen on port 9999, as their output always claimed.
- `examples/cluster.js` documents that it does not run on Windows, where
  Node.js can not share a UDP socket between the workers of a cluster.

## Testing

```
npm install
npm test
```
