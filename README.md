# `denamed` - _Pure JS DNS Server_
![Node.js Package](https://github.com/idiotworks/denamed/workflows/Node.js%20Package/badge.svg)

A lightweight, strongly typed DNS server library for deploying a highly configurable DNS server across platforms.

> **NOTE:** Default package requires Node.js 14 or later

## History

This project started of a fork of https://github.com/trevoro/node-named by Trevor Orsztynowicz and aimed to modernize
and complete some of the missing features in that original project. Some of the code is his and contributors and falls
under MIT license with his copyright. The goal of the project was to offer a lightweight library implementing the common
DNS functionality used today.

### Differences to `node-named`

- 100% strongly-typed TypeScript, including events. This corrected some bugs by itself.
- Opt-in features. It's designed to be bundled for deployment, so everything that doesn't get used can be tree-shaken.
- Logging is purely opt-in, there is a strongly-typed interface for it, but by default nothing is logged. This removes
  bunyan as a dependency.
- Moved most of the classes to interfaces. This moves this into a 'building block' library.
- Different APIs
- Some performance enhancements. Using `Buffer.unsafeAlloc` and reducing the class overhead into pure functions shave
  off some time.

## Creating a DNS Server

```typescript
import { createConsoleLog, createSoaRecord, Server } from "denamed";

const server = new Server({
  port: 9999,
  log: createConsoleLog(),
});

server.on("query", (query) => {
  const domain = query.name;
  const record = createSoaRecord({ host: domain, serial: 12345, ttl: 300 });
  query.addAnswer(domain, record, 300);
  server.send(query);
});

server
  .start()
  .then((server) =>
    console.log(`Server listening on ${server.address}:${server.port}...`)
  )
  .catch(console.error);
```

## Creating DNS Records

`denamed` provides helper functions for creating DNS records. These functions are named `create[type]Record`
where `type` is one of ['A', 'AAAA', 'CNAME', 'SOA', 'MX', 'NS', 'TXT, 'SRV']. It is important to remember that these
DNS records are not permanently added to the server. They only exist for the length of the particular request. After
that, they are destroyed. This means you have to create your own lookup mechanism.

```typescript
import { createSoaRecord } from "denamed";

var soaRecord = createSoaRecord({ host: "example.com", serial: 201205150000 });
console.log(soaRecord);
```

### Supported Record Types

The following record types are supported

- A (ipv4)
- AAAA (ipv6)
- CNAME (aliases)
- SOA (start of authority)
- MX (mail server records)
- NS (nameserver entries)
- TXT (arbitrary text entries)
- SRV (service discovery)

### TODO

- Better record validation
- Create DNS client for query recursor
- Add support for PTR records
- Add support for TCP AXFR requests
- Add better message compression using 'reference pointers' instead of additional nsName entries.
