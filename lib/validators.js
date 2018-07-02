var ipaddr = require('ipaddr.js');
var net = require('net');

module.exports = {
    nsName: (v) => {
        // hostname regex per RFC1123
        var reg = /^([a-z0-9]|[a-z0-9][a-z0-9\-]{0,61}[a-z0-9])(\.([a-z0-9]|[a-z0-9][a-z0-9\-]{0,61}[a-z0-9]))*$/i;
        if (typeof (v) !== 'string')
            return false;
        if (v.length > 255)
            return false;

        if (reg.test(v))
            return true;
        else
            return false;
    },

    UInt32BE: (v) => {
        if (typeof (v) === 'number') {
            var n = parseInt(v);
            return n !== NaN && n < 4294967295;
        }
        else 
            return false;
    },

    UInt16BE: (v) => {
        if (typeof (v) === 'number') {
            var n = parseInt(v);
            return n !== NaN && n < 65535;
        }
        else 
            return false;
    },

    nsText: (v)=>  {
        if (typeof (v) === 'string') {
            if (v.length < 256)
                return true;
        }
        else 
            return false;
    },

    IPv4: (v) => {
        return net.isIPv4(v);
    },

    IPv6: (v) => {
        return net.isIPv6(v);
    },

    validate: (obj, model) => {
        var result = true;
        for (v in model) {
            valid = model[v](obj[v]);
            if (!valid) {
                result = false;
                break;
            }
        }
        return result;
    }
}