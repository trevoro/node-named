var validators = require('../validators');

var AAAA = function(target) {
  if (typeof(target) !== 'string')
    throw new TypeError('IPv6Addr (string) is required');
  
  this.target = target;
}

AAAA.prototype.valid = function() {
  var self = this, model = {};
  model = {
    target: validators.IPv6
  };
  return validators.validate(self, model);
}

module.exports = {
  AAAA: AAAA
}
