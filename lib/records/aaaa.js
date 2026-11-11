'use strict';

const validators = require('../validators');

const MODEL = {
  target: validators.IPv6
};

class AAAA {
  constructor(target) {
    if (typeof (target) !== 'string')
      throw new TypeError('IPv6Addr (string) is required');

    this.target = target;
    this._type = 'AAAA';
  }

  valid() {
    return validators.validate(this, MODEL);
  }
}

module.exports = AAAA;
