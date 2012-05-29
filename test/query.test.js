var dig = require('./dig');

if (require.cache[__dirname + '/helper.js'])
  delete require.cache[__dirname + '/helper.js']
var helper = require('./helper');

var test = helper.test;
var options = {port: 9999, server: '::1'};

test('query: example.com (A)', function(t) {
  dig('example.com', 'A', options, function(err, results) {
    var ok = { name: 'example.com.', ttl: 5, type: 'A', target: '127.0.0.1' };
    t.deepEqual(results.answers[0], ok);
    t.end();
  });
});

