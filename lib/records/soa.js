var validators = require('../validators');

module.exports = class SOA {
    constructor(host, opts) {
        if (typeof (host) !== 'string')
            throw new TypeError('host (string) is required');

        if (!opts) opts = {};

        var defaults = {
            admin: 'hostmaster.' + host,
            serial: 0,
            refresh: 10,
            retry: 10,
            expire: 10,
            ttl: 10
        };

        for (key in defaults) {
            if (key in opts) continue;
            opts[key] = defaults[key];
        }

        this.host = host;
        this.admin = opts.admin;
        this.serial = opts.serial;
        this.refresh = opts.refresh;
        this.retry = opts.retry;
        this.expire = opts.expire;
        this.ttl = opts.ttl;
        this._type = 'SOA';
    }

    valid() {
        var model = {
            host: validators.nsName,
            admin: validators.nsName,
            serial: validators.UInt32BE,
            refresh: validators.UInt32BE,
            retry: validators.UInt32BE,
            expire: validators.UInt32BE,
            ttl: validators.UInt32BE
        };

        return validators.validate(this, model);
    }
}