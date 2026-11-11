'use strict';

const validators = require('../validators');

const MODEL = {
  target: validators.IPv4
};

class A {
  constructor(target) {
    if (typeof (target) !== 'string')
      throw new TypeError('IPv4Addr (string) is required');

    this.target = target;
    this._type = 'A';
  }

  valid() {
    return validators.validate(this, MODEL);
  }
}

module.exports = A;
