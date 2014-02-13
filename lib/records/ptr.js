var validators = require('../validators');

function PTR(target) {
        if (typeof(target) !== 'string')
                throw new TypeError('target (string) is required');

        this.target = target;
        this._type = 'PTR';
}
module.exports = PTR;


PTR.prototype.valid = function valid() {
        var self = this, model = {};
        model = {
                target: validators.nsName
        };
        return validators.validate(self, model);
};