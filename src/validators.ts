import net from "net";

export const nsName = (v: string) => {
  // hostname regex per RFC1123
  const reg = /^([a-z0-9]|[a-z0-9][a-z0-9\-]{0,61}[a-z0-9])(\.([a-z0-9]|[a-z0-9][a-z0-9\-]{0,61}[a-z0-9]))*$/i;
  if (typeof v !== "string") {
    return false;
  }
  if (v.length > 255) {
    return false;
  }
  return reg.test(v);
};

export const UInt32BE = function (v: number) {
  const n = Number(v);
  return !isNaN(n) && n < 4294967295;
};
export const UInt16BE = function (v: number) {
  const n = Number(v);
  return !isNaN(n) && n < 65535;
};
export const nsText = function (v: string) {
  if (typeof v === "string") {
    if (v.length < 256) {
      return true;
    }
  } else {
    return false;
  }
};

export const IPv4 = function (v: string) {
  return net.isIPv4(v);
};
export const IPv6 = function (v: string) {
  return net.isIPv6(v);
};

export const validate = (obj: any, model: any) =>
  Object.keys(model).every((v) => model[v](obj[v]));
