'use strict';

const net = require('net');

// hostname regex per RFC1123
const HOSTNAME = /^([a-z0-9]|[a-z0-9][a-z0-9\-]{0,61}[a-z0-9])(\.([a-z0-9]|[a-z0-9][a-z0-9\-]{0,61}[a-z0-9]))*$/i;

const MAX_UINT32 = 0xFFFFFFFF;
const MAX_UINT16 = 0xFFFF;

function isUInt(v, max) {
  return Number.isInteger(v) && v >= 0 && v <= max;
}

module.exports = {
  nsName: function (v) {
    return typeof (v) === 'string' && v.length <= 255 && HOSTNAME.test(v);
  },
  UInt32BE: function (v) {
    return isUInt(v, MAX_UINT32);
  },
  UInt16BE: function (v) {
    return isUInt(v, MAX_UINT16);
  },
  nsText: function (v) {
    return typeof (v) === 'string' && v.length < 256;
  },
  IPv4: function (v) {
    return net.isIPv4(v);
  },
  IPv6: function (v) {
    return net.isIPv6(v);
  },
  // checks every property named in the model with the validator given for it
  validate: function (obj, model) {
    for (const key of Object.keys(model)) {
      if (!model[key](obj[key]))
        return false;
    }
    return true;
  }
};
