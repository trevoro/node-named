var validators = require('../validators');

function AAAA(target) {
        if (typeof (target) !== 'string')
                throw new TypeError('IPv6Addr (string) is required');

        this.target = target;
        this._type = 'AAAA';
}
module.exports = AAAA;

AAAA.prototype.valid = function valid() {
        var self = this, model = {};
        model = {
                target: validators.IPv6
        };
        return validators.validate(self, model);
};
