'use strict';

const validators = require('../validators');

const MODEL = {
  target: validators.nsText
};

class TXT {
  constructor(target) {
    if (typeof (target) !== 'string')
      throw new TypeError('target (string) is required');

    this.target = target;
    this._type = 'TXT';
  }

  valid() {
    return validators.validate(this, MODEL);
  }
}

module.exports = TXT;
