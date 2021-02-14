import { samples } from "./dnsbuffer";
import { createQuery, parse, QuerySource, RawQuery } from "../src";

let raw: RawQuery;
let src: QuerySource;

beforeAll(() => {
  try {
    raw = {
      buf: samples[0].raw,
      len: samples[0].raw.length,
    };
    src = {
      family: "udp6",
      address: "127.0.0.1",
      port: 23456,
    };
  } catch (e) {
    console.error(e.stack);
    process.exit(1);
  }
});

test("decode a query datagram", () => {
  const query = parse(raw, src);
});

test("create a new query object", () => {
  const decoded = parse(raw, src);
  const query = createQuery(decoded!);
});

test("encode an null-response query object", () => {
  const decoded = parse(raw, src);
  const query = createQuery(decoded!);
  query.encode();
  const ok = samples[0].raw;
  expect(query._raw!.buf).toStrictEqual(ok);
});

// TODO test adding a record
// TODO test name response
// TODO test answers response
