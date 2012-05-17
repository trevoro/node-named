var validators = require('../validators');

var TXT = function(target) {
  if (typeof(target) !== 'string')
    throw new TypeError('target (string) is required');
  
  this.target = target;
}

module.exports = {
  TXT: TXT
}
