'use strict';

const validators = require('../validators');

const MODEL = {
  target: validators.nsName
};

class NS {
  constructor(target) {
    if (typeof (target) !== 'string')
      throw new TypeError('target (string) is required');

    this.target = target;
    this._type = 'NS';
  }

  valid() {
    return validators.validate(this, MODEL);
  }
}

module.exports = NS;
