var named = require('../lib');

if (require.cache[__dirname + '/helper.js'])
  delete require.cache[__dirname + '/helper.js']
var helper = require('./helper');

var test = helper.test;

var PORT = 12345;

test('listen and close (port only)', function(t) {
  var server = named.createServer();
  server.listen(PORT, function() { 
    setTimeout(function() {
      server.close(function () {
        t.end();
      })
    }, 100);
  });
});

test('listen and close (port and ::1)', function(t) {
  var server = named.createServer();
  server.listen(String(PORT), '::1', function() { 
    setTimeout(function() {
      server.close(function () {
        t.end();
      })
    }, 100);
  });
});

