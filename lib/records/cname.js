
var validators = require('../validators');

var CNAME = function(target) {
  if (typeof(target) !== 'string')
    throw new TypeError('target (string) is required');
  
  this.target = target;
}

CNAME.prototype.valid = function() {
  var self = this, model = {};
  model = {
    target: validators.nsName
  };
  return validators.validate(self, model);
}


module.exports = {
  CNAME: CNAME
}
