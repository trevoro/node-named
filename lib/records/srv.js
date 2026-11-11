'use strict';

const validators = require('../validators');

const MODEL = {
  target: validators.nsText, // XXX
  port: validators.UInt16BE,
  weight: validators.UInt16BE,
  priority: validators.UInt16BE
};

class SRV {
  constructor(target, port, opts) {
    if (typeof (target) !== 'string')
      throw new TypeError('host (string) is required');
    if (!port)
      throw new TypeError('port (integer) is required'); //XXX

    opts = opts || {};

    this.target = target;
    this.port = port;
    this.weight = 'weight' in opts ? opts.weight : 10;
    this.priority = 'priority' in opts ? opts.priority : 0;
    this._type = 'SRV';
  }

  valid() {
    return validators.validate(this, MODEL);
  }
}

module.exports = SRV;
