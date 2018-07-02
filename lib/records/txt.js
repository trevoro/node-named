var validators = require('../validators');

module.exports = class TXT {
    constructor(target) {
        if (typeof (target) !== 'string')
            throw new TypeError('target (string) is required');

        this.target = target;
        this._type = 'TXT';
    }

    valid() {
        var model = {
            target: validators.nsText
        };
        return validators.validate(this, model);
    }
}