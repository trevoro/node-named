var validators = require('../validators');

module.exports = class AAAA {
    constructor(target) {
        if (typeof (target) !== 'string')
            throw new TypeError('IPv6Addr (string) is required');

        this.target = target;
        this._type = 'AAAA';
    }

    valid() {
        var model = {
            target: validators.IPv6
        };
        return validators.validate(this, model);
    }
}