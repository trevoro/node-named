var sprintf = require('./sprintf').sprintf;

var _stdout = process.stdout;
var _stderr = process.stderr;

var _format = function(level, args) {
  var msg = sprintf.apply(null, args) + '\n';
  var out = 
    [ level
    , msg ].join(' ');
  return out;
}

module.exports = {
  info: function() {
    _stdout.write(_format("INFO", arguments));
  },
  debug: function() {
    _stdout.write(_format("DEBUG", arguments));
  }
}
