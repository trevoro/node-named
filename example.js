var named = require('./lib/index');
var server = named.createServer();

server.listen(9999, '127.0.0.1', function() {
  console.log('DNS server started on port 9999');
});

server.on('query', function(query) {
  var domain = query.name;
  var type = query.getType();
  console.log('DNS Query: (%s) %s', type, domain);
  switch (type) {
    case 'A':
      var target = new named.ARecord('127.0.0.1');
      query.addAnswer(domain, target, 'A');
      break;
    case 'AAAA':
      var target = new named.AaaaRecord('::1');
      query.addAnswer(domain, target, 'AAAA');
      break;
    case 'CNAME':
      var target = new named.CnameRecord('cname.example.com');
      query.addAnswer(domain, target, 'CNAME');
      break;
    case 'MX':
      var target = new named.MxRecord('smtp.example.com');
      query.addAnswer(domain, target, 'MX');
      break;
    case 'SOA':
      var target = new named.SoaRecord('example.com');
      query.addAnswer(domain, target, 'SOA');
      break;
    case 'SRV':
      var target = new named.SrvRecord('sip.example.com', 5060);
      query.addAnswer(domain, target, 'SRV');
      break;
		case 'TXT':
      var target = new named.TxtRecord('hello world');
      query.addAnswer(domain, target, 'TXT');
      break;
  }
  server.send(query);
});

server.on('clientError', function(error) {
	console.log("there was an error: %s", error);
});
