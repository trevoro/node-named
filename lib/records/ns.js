var validators = require('../validators');

function NSRecord(target) {
        if (typeof(target) !== 'string')
                throw new TypeError('target (string) is required');

        this.target = target;
        this._type = 'NS';
}
module.exports = NSRecord;


NSRecord.prototype.valid = function valid() {
        var self = this, model = {};
        model = {
                target: validators.nsName
        };
        return validators.validate(self, model);
};