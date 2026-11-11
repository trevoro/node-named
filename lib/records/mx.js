'use strict';

const validators = require('../validators');

const MODEL = {
  exchange: validators.nsName,
  ttl: validators.UInt32BE,
  priority: validators.UInt16BE
};

class MX {
  constructor(exchange, opts) {
    if (typeof (exchange) !== 'string')
      throw new TypeError('exchange (string) is required');

    opts = opts || {};

    this.exchange = exchange;
    this.ttl = 'ttl' in opts ? opts.ttl : 600;
    this.priority = 'priority' in opts ? opts.priority : 0;
    this._type = 'MX';
  }

  valid() {
    return validators.validate(this, MODEL);
  }
}

module.exports = MX;
