var validators = require('../validators');

var TXT = function(target) {
  if (typeof(target) !== 'string')
    throw new TypeError('target (string) is required');
  
  this.target = target;
}

TXT.prototype.valid = function() {
  var self = this, model = {};
  model = {
    target: validators.nsText
  };
  return validators.validate(self, model);
}


module.exports = {
  TXT: TXT
}
