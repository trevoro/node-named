var named = require('./lib/index');
var server = named.createServer();

server.listen(9999, '127.0.0.1', function() {
  console.log('DNS server started on port 9999');
});

server.on('query', function(query) {
  var domain = query.name();
  console.log('DNS Query: %s', domain)
	var record = new named.SoaRecord(domain, {serial: 12345});
  query.addAnswer(domain, record, 'SOA');
  console.log(query);
  server.send(query);
});
