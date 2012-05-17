var validators = require('../validators');

var A = function(target) {
  if (typeof(target) !== 'string')
    throw new TypeError('target (string) is required');
  
  this.target = target;

}

/*
A.prototype.valid = function() {
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
  A: A,
}
