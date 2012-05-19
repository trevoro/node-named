var validators = require('../validators');

var A = function(target) {
  if (typeof(target) !== 'string')
    throw new TypeError('IPv4Addr (string) is required');
  
  this.target = target;
  
}

A.prototype.valid = function() {
  var self = this, model = {};
  model = {
    target: validators.IPv4
  };
  return validators.validate(self, model);
}


module.exports = {
  A: A,
}
