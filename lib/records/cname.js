var validators = require('../validators');



function CNAME(target) {
        if (typeof(target) !== 'string')
                throw new TypeError('target (string) is required');

        this.target = target;
        this._type = 'CNAME';
}
module.exports = CNAME;


CNAME.prototype.valid = function valid() {
        var self = this, model = {};
        model = {
                target: validators.nsName
        };
        return validators.validate(self, model);
};
