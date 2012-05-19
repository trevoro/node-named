var path = require('path');
var v = require(path.join(__dirname, '../lib/validators'))

var toTest = {
  nsName: [
    { id: 0,
      data: 'example.com', 
      should: true
    },
    { id: 0,
      data: '0example.com',
      should: true
    },
   [ '_example.com', false ],
   [ '0_example.com', false ],
   [ '-example.com', false ],
   [ '0-example.com', true ],
   [ 'example-one.com', true ],
   [ 'example-111.com', true ],
   [ 'Example-111.com', true ],
   [ 'areallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevaliareallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevalidkareallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevaliareallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevaliareallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevalidkareallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevaliareallylonghostnamethatshouldneverbevalidareallylonghostnamethatshouldneverbevalid.com', false ],
   [ 'a name with spaces', false ]
  ]
};

var runTest = function() {
  for (var k in toTest) {
    console.log(">>> Testing validator: %s", k);
    for (i in toTest[k]) {
      var s = toTest[k][i][0];
      var should = toTest[k][i][1];
      var result = v.nsName(s);
      console.log("  > %s : %s", s, (result == should ? 'Ok' : 'Error'));
    }
  }
}

module.exports = {
  run: runTest
}
