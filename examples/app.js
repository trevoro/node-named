var named = require('../lib');
var server = named.createServer();

server.listen(9999, '127.0.0.1', () => {
    console.log('DNS server started on port 9999');
});

console.log(named.SoaRecord);

server.on('query', (query) => {
    var domain = query.name();
    var record = new named.SOARecord(domain, { serial: 12345, ttl: 300 });
    query.addAnswer(domain, record, 300);
    server.send(query);
});