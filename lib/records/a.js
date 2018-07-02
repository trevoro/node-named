var validators = require('../validators');

module.exports = class A {
    constructor(target) {
        if (typeof (target) !== 'string')
            throw new TypeError('IPv4Addr (string) is required');

        this.target = target;
        this._type = 'A';
    }

    valid() {
        var model = {
            target: validators.IPv4
        };

        return validators.validate(this, model);
    }
}