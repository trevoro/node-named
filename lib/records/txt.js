var validators = require('../validators');

function TXT(target) {
        if (typeof(target) !== 'string')
                throw new TypeError('target (string) is required');

        this.target = target;
        this._type = 'TXT';
}
module.exports = TXT;


TXT.prototype.valid = function TXT() {
        var self = this, model = {};
        model = {
                target: validators.nsText
        };
        return validators.validate(self, model);
};
