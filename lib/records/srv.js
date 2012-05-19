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
  };

  for (key in defaults) {
    if (key in opts) continue;
    opts[key] = defaults[key];
  }

  this.target = target;
  this.port = port;
  this.weight = opts.weight;
  this.priority = opts.priority;

}

SRV.prototype.valid = function() {
  var self = this, model = {};
  model = {
    target: validators.nsText, // XXX
    port: validators.UInt16BE,
    weight: validators.UInt16BE,
    priority: validators.UInt16BE
  };
  return validators.validate(self, model);
}

module.exports = {
  SRV: SRV
}
