var validators = require('../validators');

var AAAA = function(target) {
  if (typeof(target) !== 'string')
    throw new TypeError('target (string) is required');
  
  this.target = target;
}

module.exports = {
  AAAA: AAAA
}
