var dig = require('./dig');
var named = require('../lib');

if (require.cache[__dirname + '/helper.js'])
  delete require.cache[__dirname + '/helper.js']
var helper = require('./helper');

// -- globals
var server;
var test = helper.test;
var before = helper.before;
var after = helper.after;

var options = {port: 9999, server: '::1'};

before(function(callback) {
  try {
    server = named.createServer({
      log: helper.getLog('server')
    });
    
    server.on('query', function(query) {
      var domain = query.name()
      var type = query.type();
      
      switch (type) {
        case 'A':
          var record = new named.ARecord('127.0.0.1');
          query.addAnswer(domain, record, 'A');
          break;
        case 'AAAA':
          var record = new named.AaaaRecord('::1');
          query.addAnswer(domain, record, 'AAAA');
          break;
        case 'CNAME':
          var record = new named.CnameRecord('cname.example.com');
          query.addAnswer(domain, record, 'CNAME');
          break;
        case 'MX':
          var record = new named.MxRecord('smtp.example.com');
          query.addAnswer(domain, record, 'MX');
          break;
        case 'SOA':
          var record = new named.SoaRecord('example.com');
          query.addAnswer(domain, record, 'SOA');
          break;
        case 'SRV':
          var record = new named.SrvRecord('sip.example.com', 5060);
          query.addAnswer(domain, record, 'SRV');
          break;
        case 'TXT':
          var record = new named.TxtRecord('hello world');
          query.addAnswer(domain, record, 'TXT');
          break;
      }
      server.send(query);
    });

    server.listen(options.port, options.server, function() {
      process.nextTick(callback);
    });

  }
  catch (e) {
    console.error(e.stack);
    process.exit(1);
  }
});

after(function (callback) {
  try {
    server.close(callback);
  }
  catch (e) {
    console.error(e.stack);
    process.exit(1);
  }
});

test('listen and close (port only)', function(t) {
  var server = named.createServer();
  server.listen(options.port, function() { 
    setTimeout(function() {
      server.close(function () {
        t.end();
      })
    }, 100);
  });
});

test('listen and close (port and ::1)', function(t) {
  var server = named.createServer();
  server.listen(String(options.port), '::1', function() { 
    setTimeout(function() {
      server.close(function () {
        t.end();
      })
    }, 100);
  });
});

test('answer query: example.com (A)', function(t) {
  dig('example.com', 'A', options, function(err, results) {
    var ok = [{ name: 'example.com.', ttl: 5, type: 'A', target: '127.0.0.1' }];
    t.deepEqual(results.answers, ok);
    t.end();
  });
});

test('answer query: example.com (AAAA)', function(t) {
  dig('example.com', 'AAAA', options, function(err, results) {
    var ok = [{ name: 'example.com.', ttl: 5, type: 'AAAA', target: '::1' }];
    t.deepEqual(results.answers, ok);
    t.end();
  });
});

test('answer query: example.com (CNAME)', function(t) {
  dig('www.example.com', 'CNAME', options, function(err, results) {
    var ok = [{ name: 'www.example.com.', ttl: 5, type: 'CNAME', target: 'cname.example.com.' }];
    t.deepEqual(results.answers, ok);
    t.end();
  });
});

test('answer query: example.com (MX)', function(t) {
  dig('example.com', 'MX', options, function(err, results) {
    var ok = [{ name: 'example.com.', ttl: 5, type: 'MX', target: '0 smtp.example.com.' }];
    t.deepEqual(results.answers, ok);
    t.end();
  });
});

test('answer query: example.com (SOA)', function(t) {
  dig('example.com', 'SOA', options, function(err, results) {
    var ok = [{ name: 'example.com.', ttl: 5, type: 'SOA', target: 'example.com. hostmaster.example.com. 0 10 10 10 10'}];
    t.deepEqual(results.answers, ok);
    t.end();
  });
});

test('answer query: example.com (SRV)', function(t) {
  dig('_sip._tcp.example.com', 'SRV', options, function(err, results) {
    var ok = [{ name: '_sip._tcp.example.com.', ttl: 5, type: 'SRV', target: '0 10 5060 sip.example.com.'}];
    t.deepEqual(results.answers, ok);
    t.end();
  });
});

test('answer query: example.com (TXT)', function(t) {
  dig('example.com', 'TXT', options, function(err, results) {
    var ok = [{ name: 'example.com.', ttl: 5, type: 'TXT', target: '"hello world"'}];
    t.deepEqual(results.answers, ok);
    t.end();
  });
});


