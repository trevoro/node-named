/*

         This excellent error creator concept was borrowed from Mark Cavage
         https://github.com/mcavage/node-ldapjs/blob/master/lib/errors/index.js

*/

'use strict';

const CODES = {
  DNS_NO_ERROR:        0,
  DNS_PROTOCOL_ERROR:  1,
  DNS_CANNOT_PROCESS:  2,
  DNS_NO_NAME:         3,
  DNS_NOT_IMPLEMENTED: 4,
  DNS_REFUSED:         5,
  DNS_EXCEPTION:       6
};

// error name -> [code, default message]
const ERRORS = {
  ProtocolError:       [CODES.DNS_PROTOCOL_ERROR,  'Protocol Error'],
  CannotProcessError:  [CODES.DNS_CANNOT_PROCESS,  'Cannot Process'],
  NoNameError:         [CODES.DNS_NO_NAME,         'No Name'],
  NotImplementedError: [CODES.DNS_NOT_IMPLEMENTED, 'Not Implemented'],
  RefusedError:        [CODES.DNS_REFUSED,         'Refused'],
  ExceptionError:      [CODES.DNS_EXCEPTION,       'Exception']
};


class DnsError extends Error {
  constructor(name, code, msg, caller) {
    super();

    if (Error.captureStackTrace)
      Error.captureStackTrace(this, caller || DnsError);

    this.code = code;
    this.name = name;

    // Note that, unlike a regular Error, the message is a function
    this.message = function message() {
      return msg || name;
    };
  }
}


module.exports = Object.assign({ DnsError: DnsError }, CODES);

Object.keys(ERRORS).forEach(function (name) {
  const code = ERRORS[name][0];
  const defaultMessage = ERRORS[name][1];

  // The computed key gives the class its name
  const errors = {
    [name]: class extends DnsError {
      constructor(message, caller) {
        super(name, code, message || defaultMessage, caller || errors[name]);
      }
    }
  };

  module.exports[name] = errors[name];
});
