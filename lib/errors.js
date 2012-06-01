/*

         This excellent error creator concept was borrowed from Mark Cavage
         https://github.com/mcavage/node-ldapjs/blob/master/lib/errors/index.js

*/


var util = require('util');

var CODES = {
        DNS_NO_ERROR:        0,
        DNS_PROTOCOL_ERROR:  1,
        DNS_CANNOT_PROCESS:  2,
        DNS_NO_NAME:         3,
        DNS_NOT_IMPLEMENTED: 4,
        DNS_REFUSED:         5,
        DNS_EXCEPTION:       6
}

var ERRORS = [];

function DnsError(name, code, msg, caller) {
        if (Error.captureStackTrace)
                Error.captureStackTrace(this, caller || DnsError);

        this.code = code;
        this.name = name;

        this.message = function() {
                return msg || name;
        }
}

util.inherits(DnsError, Error);


module.exports = {};
module.exports.DnsError = DnsError;

Object.keys(CODES).forEach(function (code) {
  module.exports[code] = CODES[code];

  if (CODES[code] === 0)
    return;

  var err = '', msg = '';
  var pieces = code.split('_').slice(1);
  for (var i in pieces) {
        var lc = pieces[i].toLowerCase();
        var key = lc.charAt(0).toUpperCase() + lc.slice(1);
        err += key;
        msg += key + (( i + 1 ) < pieces.length ? ' ' : '');
  }

  if (!/\w+Error$/.test(err))
        err += 'Error';

  module.exports[err] = function(message, caller) {
        DnsError.call(this,
                            err,
                            CODES[code],
                            message || msg,
                            caller || module.exports[err]);

  };
  module.exports[err].constructor = module.exports[err];
  util.inherits(module.exports[err], DnsError);

  ERRORS[CODES[code]] = {
                err: err,
                message: msg
        }

});
