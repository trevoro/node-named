var validators = require('../validators');

var SOA = function(host, opts) {
  if (typeof(host) !== 'string')
    throw new TypeError('host (string) is required');
  
  if (!opts) 
    opts = {};
  
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

}

/*
SOA.prototype.valid = function() {
  var valid = true, model = {}, errors = [];
  
  model = {
    host: validators.nsName,
    admin: validators.nsName,
    serial: validators.UInt32BE,
    refresh: validators.UInt32BE,
    retry: validators.UInt32BE,
    expires: validators.UInt32BE,
    ttl: validators.UInt32BE
  };

  for (v in model) {
    valid = model[v](this[v]);
    if (!valid) break;
  }

  return valid;

}
*/

module.exports = {
  SOA: SOA
}
