var validators = require('../validators');

module.exports = class NS {
    constructor(target) {
        if (typeof (target) !== 'string')
            throw new TypeError('target (string) is required');

        this.target = target;
        this._type = 'NS';
    }

    valid() {
        var model = {
            target: validators.nsName
        };
        return validators.validate(this, model);
    }
}