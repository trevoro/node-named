var named = require('./lib/index');
var record = named.Record;
var server = named.createServer();
var qType = named.Protocol.queryTypes;
var assert = require('assert');

server.listen(9999, '127.0.0.1', function() {
  console.log('DNS server started on port 9999');
});

server.on('query', function(query) {
  var domain = query.question.name;
  var type = query.question.type;
  console.log('DNS Query: (%s) %s', type, domain);
  switch (type) {
    case qType['A']:
      var target = new record.A('127.0.0.1');
      query.addAnswer(domain, target, 'A');
      break;
    case qType['AAAA']:
      var target = new record.AAAA('::1');
      query.addAnswer(domain, target, 'AAAA');
      break;
    case qType['CNAME']:
      var target = new record.CNAME('cname.example.com');
      query.addAnswer(domain, target, 'CNAME');
      break;
    case qType['MX']:
      var target = new record.MX('smtp.example.com');
      query.addAnswer(domain, target, 'MX');
      break;
    case qType['SOA']:
      var target = new record.SOA('example.com');
      query.addAnswer(domain, target, 'SOA');
      break;
    case qType['SRV']:
      var target = new record.SRV('sip.example.com', 5060);
      assert.ok(target.valid());
      query.addAnswer(domain, target, 'SRV');
      break;
    case qType['TXT']:
      var target = new record.TXT('hello world');
      query.addAnswer(domain, target, 'TXT');
      break;
  }
  server.send(query);
});
