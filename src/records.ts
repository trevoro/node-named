import { IPv4, IPv6, nsName, nsText, UInt16BE, UInt32BE } from "./validators";

export interface DnsRecord {
  type: string;
}

export type IPv4Addr = string;

export type IPv6Addr = string;

export interface ARecord extends DnsRecord {
  type: "A";
  target: IPv4Addr;
}

export const createARecord = (target: IPv4Addr): ARecord => ({
  type: "A",
  target,
});

export interface AaaaRecord extends DnsRecord {
  type: "AAAA";
  target: IPv6Addr;
}

export const createAaaaRecord = (target: IPv6Addr): AaaaRecord => ({
  type: "AAAA",
  target,
});

export interface CnameRecord extends DnsRecord {
  type: "CNAME";
  target: string;
}

export const createCnameRecord = (target: string): CnameRecord => ({
  type: "CNAME",
  target,
});

export interface MxRecord extends DnsRecord {
  type: "MX";
  exchange: string;
  ttl: number;
  priority: number;
}

export const createMxRecord = (
  record: Pick<MxRecord, "exchange"> & Partial<MxRecord>
): MxRecord => ({
  type: "MX",
  priority: record.priority ?? 0,
  ttl: record.ttl ?? 600,
  exchange: record.exchange,
});

export interface NsRecord extends DnsRecord {
  type: "NS";
  target: string;
}

export const createNsRecord = (target: string): NsRecord => ({
  type: "NS",
  target,
});

export interface TxtRecord extends DnsRecord {
  type: "TXT";
  target: string;
}

export const createTxtRecord = (target: string): TxtRecord => ({
  type: "TXT",
  target,
});

export interface SoaRecord extends DnsRecord {
  type: "SOA";
  host: string;
  admin: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  ttl: number;
}

export const createSoaRecord = (
  record: Pick<SoaRecord, "host"> & Partial<SoaRecord>
): SoaRecord => ({
  type: "SOA",
  admin: record.admin ?? "hostmaster." + record.host,
  host: record.host,
  serial: record.serial ?? 0,
  refresh: record.refresh ?? 10,
  retry: record.retry ?? 10,
  expire: record.expire ?? 10,
  ttl: record.ttl ?? 10,
});

export interface SrvRecord extends DnsRecord {
  type: "SRV";
  target: string;
  port: number;
  weight: number;
  priority: number;
}

export const createSrvRecord = (
  record: Pick<SrvRecord, "target" | "port"> & Partial<SrvRecord>
): SrvRecord => ({
  type: "SRV",
  priority: 0,
  weight: 10,
  target: record.target,
  port: record.port,
});

export const RecordValidationModels = {
  A: {
    target: IPv4,
  },
  AAAA: {
    target: IPv6,
  },
  CNAME: {
    target: nsName,
  },
  MX: {
    exchange: nsName,
    ttl: UInt32BE,
    priority: UInt16BE,
  },
  NS: {
    target: nsName,
  },
  SOA: {
    host: nsName,
    admin: nsName,
    serial: UInt32BE,
    refresh: UInt32BE,
    retry: UInt32BE,
    expire: UInt32BE,
    ttl: UInt32BE,
  },
  SRV: {
    target: nsText, // XXX
    port: UInt16BE,
    weight: UInt16BE,
    priority: UInt16BE,
  },
  TXT: {
    target: nsText,
  },
};
