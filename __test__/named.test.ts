import { dig } from "./dig";
import {
  createAaaaRecord,
  createARecord,
  createCnameRecord,
  createConsoleLog,
  createMxRecord,
  createNsRecord,
  createSoaRecord,
  createSrvRecord,
  createTxtRecord,
  Server,
} from "../src";

const options = { port: 9999, server: "::1" };

let server: Server | undefined;
beforeAll(async () => {
  server = new Server({
    log: createConsoleLog(),
    port: 9999,
  });

  server.on("query", async (query) => {
    const domain = query.name;
    const type = query.type;
    switch (type) {
      case "A":
        query.addAnswer(domain, createARecord("127.0.0.1"));
        break;
      case "AAAA":
        query.addAnswer(domain, createAaaaRecord("::1"));
        break;
      case "CNAME":
        query.addAnswer(domain, createCnameRecord("cname.example.com"));
        break;
      case "NS":
        query.addAnswer(domain, createNsRecord("ns.example.com"));
        break;
      case "MX":
        query.addAnswer(
          domain,
          createMxRecord({ exchange: "smtp.example.com" })
        );
        break;
      case "SOA":
        query.addAnswer(domain, createSoaRecord({ host: "example.com" }));
        break;
      case "SRV":
        query.addAnswer(
          domain,
          createSrvRecord({
            target: "sip.example.com",
            port: 5060,
          })
        );
        break;
      case "TXT":
        query.addAnswer(domain, createTxtRecord("hello world"));
        break;
    }
    query.respond!();
  });

  await server.start();
});

afterAll(() => server!.close());

test("listen and close (port only)", () => {
  // don't conflict with the server made in 'before'
  const server = new Server({
    port: 1153,
  });
  return server.start().then((server) => server.close());
});

test("listen and close (port and ::1)", () => {
  const server = new Server({
    port: 1153,
    address: "::1",
  });
  return server.start().then((server) => server.close());
});

test("answer query: example.com (A)", async () => {
  const results = await dig("example.com", "A", options);
  expect(results.answers).toStrictEqual([
    {
      name: "example.com.",
      ttl: 5,
      type: "A",
      target: "127.0.0.1",
    },
  ]);
});

test("answer query: example.com (AAAA)", async () => {
  const results = await dig("example.com", "AAAA", options);
  expect(results.answers).toStrictEqual([
    {
      name: "example.com.",
      ttl: 5,
      type: "AAAA",
      target: "::1",
    },
  ]);
});

test("answer query: example.com (CNAME)", async () => {
  const results = await dig("www.example.com", "CNAME", options);
  expect(results.answers).toStrictEqual([
    {
      name: "www.example.com.",
      ttl: 5,
      type: "CNAME",
      target: "cname.example.com.",
    },
  ]);
});

test("answer query: example.com (NS)", async () => {
  const results = await dig("example.com", "NS", options);
  expect(results.answers).toStrictEqual([
    {
      name: "example.com.",
      ttl: 5,
      type: "NS",
      target: "ns.example.com.",
    },
  ]);
});

test("answer query: example.com (MX)", async () => {
  const results = await dig("example.com", "MX", options);
  expect(results.answers).toStrictEqual([
    {
      name: "example.com.",
      ttl: 5,
      type: "MX",
      target: "0 smtp.example.com.",
    },
  ]);
});

test("answer query: example.com (SOA)", async () => {
  const results = await dig("example.com", "SOA", options);
  expect(results.answers).toStrictEqual([
    {
      name: "example.com.",
      ttl: 5,
      type: "SOA",
      target: "example.com. hostmaster.example.com. 0 10 10 10 10",
    },
  ]);
});

test("answer query: example.com (SRV)", async () => {
  const results = await dig("_sip._tcp.example.com", "SRV", options);
  expect(results.answers).toStrictEqual([
    {
      name: "_sip._tcp.example.com.",
      ttl: 5,
      type: "SRV",
      target: "0 10 5060 sip.example.com.",
    },
  ]);
});

test("answer query: example.com (TXT)", async () => {
  const results = await dig("example.com", "TXT", options);
  expect(results.answers).toStrictEqual([
    {
      name: "example.com.",
      ttl: 5,
      type: "TXT",
      target: '"hello world"',
    },
  ]);
});
