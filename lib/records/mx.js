var validators = require('../validators');


var MX = function(exchange, opts) {
  if (typeof(exchange) !== 'string')
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

}

/*
MX.prototype.valid = function() {
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
  MX: MX
}
