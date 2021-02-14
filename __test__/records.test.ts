import {
  createAaaaRecord,
  createARecord,
  createCnameRecord,
  createMxRecord,
  createNsRecord,
  createSoaRecord,
  createSrvRecord,
  createTxtRecord,
  DnsRecord,
  RecordValidationModels,
} from "../src";
import { validate } from "../src/validators";

const testRecord = function (record: DnsRecord) {
  expect(record).not.toBeFalsy();
  expect(validate(record, (RecordValidationModels as any)[record.type])).toBe(
    true
  );
};

test("create a valid record (A)", () => {
  const record = createARecord("127.0.0.1");
  testRecord(record);
});

test("create a valid record (AAAA)", () => {
  const record = createAaaaRecord("::1");
  testRecord(record);
});

test("create a valid record (CNAME)", () => {
  const record = createCnameRecord("alias.example.com");
  testRecord(record);
});

test("create a valid record (NS)", () => {
  const record = createNsRecord("ns.example.com");
  testRecord(record);
});

test("create a valid record (MX)", () => {
  const record = createMxRecord({ exchange: "smtp.example.com" });
  testRecord(record);
});

test("create a valid record (SOA)", () => {
  const record = createSoaRecord({ host: "example.com" });
  testRecord(record);
});

test("create a valid record (SRV)", () => {
  const record = createSrvRecord({
    target: "_sip._udp.example.com",
    port: 5060,
  });
  testRecord(record);
});

test("create a valid record (TXT)", () => {
  const record = createTxtRecord("hello world");
  testRecord(record);
});
