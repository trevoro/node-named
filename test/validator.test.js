var validators = require('../lib/validators');

if (require.cache[__dirname + '/helper.js'])
  delete require.cache[__dirname + '/helper.js']
var helper = require('./helper');

var test = helper.test;

var samples = {
  nsName: [
   [ 'example.com', true ],
   [ '0example.com', true ],
   [ '_example.com', false ],
   [ '0_example.com', false ],
   [ '-example.com', false ],
   [ '0-example.com', true ],
   [ 'example-one.com', true ],
   [ 'example-111.com', true ],
   [ 'Example-111.com', true ],
   [ 'a name with spaces', false ],
   [ function() { 
     var r = ''; 
     for (var i=0;i<513;i++) { r += 'a' } 
     return r; }(), 
   false ]
  ]
};


for (var key in samples) {
  test('nsType validator: ' + key, function(t) {
    for (var i in samples[key]) {
      var s = samples[key][i][0];
      var ok = samples[key][i][1];
      var result = validators[key](s);
      t.equal(result, ok);
    }
    t.end();
  });
}
