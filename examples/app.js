var named = require('../lib');
var server = named.createServer();

server.listen(9999, '127.0.0.1', function() {
  console.log('DNS server started on port 9999');
});

server.on('query', function(query) {
  var domain = query.name();
  var record = new named.SoaRecord(domain, {serial: 12345});
  query.addAnswer(domain, record, 'SOA');
  server.send(query);
});
