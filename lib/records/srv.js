var validators = require('../validators');


var SRV = function(target, port, opts) {
  if (typeof(target) !== 'string')
    throw new TypeError('host (string) is required');
  if (!port) 
    throw new TypeError('port (integer) is required'); //XXX
  
  if (!opts) 
    opts = {};
  
  var defaults = {
    priority: 0,
    weight: 10,
    ttl: 600,
  };

  for (key in defaults) {
    if (key in opts) continue;
    opts[key] = defaults[key];
  }

  this.target = target;
  this.port = port;
  this.ttl = opts.ttl;
  this.weight = opts.weight;
  this.priority = opts.priority;

}

/*
SRV.prototype.valid = function() {
  var valid = true, model = {}, errors = [];
  
  model = {
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
  SRV: SRV
}
