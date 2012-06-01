var validators = require('../validators');

function A(target) {
        if (typeof (target) !== 'string')
                throw new TypeError('IPv4Addr (string) is required');

        this.target = target;
        this._type = 'A';
}
module.exports = A;


A.prototype.valid = function valid() {
        var self = this, model = {};
        model = {
                target: validators.IPv4
        };
        return validators.validate(self, model);
}
