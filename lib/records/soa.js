'use strict';

const validators = require('../validators');

const MODEL = {
  host: validators.nsName,
  admin: validators.nsName,
  serial: validators.UInt32BE,
  refresh: validators.UInt32BE,
  retry: validators.UInt32BE,
  expire: validators.UInt32BE,
  ttl: validators.UInt32BE
};

class SOA {
  constructor(host, opts) {
    if (typeof (host) !== 'string')
      throw new TypeError('host (string) is required');

    opts = opts || {};

    this.host = host;
    this.admin = 'admin' in opts ? opts.admin : 'hostmaster.' + host;
    this.serial = 'serial' in opts ? opts.serial : 0;
    this.refresh = 'refresh' in opts ? opts.refresh : 10;
    this.retry = 'retry' in opts ? opts.retry : 10;
    this.expire = 'expire' in opts ? opts.expire : 10;
    this.ttl = 'ttl' in opts ? opts.ttl : 10;
    this._type = 'SOA';
  }

  valid() {
    return validators.validate(this, MODEL);
  }
}

module.exports = SOA;
