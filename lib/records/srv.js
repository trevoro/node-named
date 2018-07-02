var validators = require('../validators');

module.exports = class SRV {
    constructor(target, port, opts) {
        if (typeof (target) !== 'string')
            throw new TypeError('host (string) is required');
        if (!port)
            throw new TypeError('port (integer) is required'); //XXX

        if (!opts) opts = {};

        var defaults = {
            priority: 0,
            weight: 10,
        };

        for (key in defaults) {
            if (key in opts) continue;
            opts[key] = defaults[key];
        }

        this.target = target;
        this.port = port;
        this.weight = opts.weight;
        this.priority = opts.priority;
        this._type = 'SRV';
    }

    valid() {
        var model = {
            target: validators.nsText,
            port: validators.UInt16BE,
            weight: validators.UInt16BE,
            priority: validators.UInt16BE
        };
        return validators.validate(this, model);
    }
}