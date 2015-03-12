var validators = require('../validators');



function NS(target) {
        if (typeof(target) !== 'string')
                throw new TypeError('target (string) is required');

        this.target = target;
        this._type = 'NS';
}
module.exports = NS;


NS.prototype.valid = function valid() {
        var self = this, model = {};
        model = {
                target: validators.nsName
        };
        return validators.validate(self, model);
};
