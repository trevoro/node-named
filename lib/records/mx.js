var validators = require('../validators');


function MX(exchange, opts) {
        if (typeof (exchange) !== 'string')
                throw new TypeError('exchange (string) is required');

        if (!opts)
                opts = {};

        var defaults = {
                priority: 0,
                ttl: 600,
        };

        for (key in defaults) {
                if (key in opts) continue;
                opts[key] = defaults[key];
        }

        this.exchange = exchange;
        this.ttl = opts.ttl;
        this.priority = opts.priority;
        this._type = 'MX';
}
module.exports = MX;


MX.prototype.valid = function valid() {
        var self = this, model = {};
        model = {
                exchange: validators.nsName,
                ttl: validators.UInt32BE,
                priority: validators.UInt16BE
        };
        return validators.validate(self, model);
};
