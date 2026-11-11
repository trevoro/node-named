'use strict';

const validators = require('../validators');

const MODEL = {
  target: validators.nsName
};

class CNAME {
  constructor(target) {
    if (typeof (target) !== 'string')
      throw new TypeError('target (string) is required');

    this.target = target;
    this._type = 'CNAME';
  }

  valid() {
    return validators.validate(this, MODEL);
  }
}

module.exports = CNAME;
