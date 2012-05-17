var named = require('./lib/index');
var record = named.Record;
var server = named.createServer();

server.listen(9999, '127.0.0.1', function() {
  console.log('DNS server started on port 9999');
});

server.on('query', function(query) {
  console.log('DNS Query: %s', query.question.name);
  var domain = query.question.name;
	var target = new record.SOA(domain, {serial: 12345});
  query.addAnswer(domain, target, 'SOA');
  server.send(query);
});
