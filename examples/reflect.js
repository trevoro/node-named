var named = require('../lib');
var server = named.createServer();

server.listen(9999, '127.0.0.1', () => {
    console.log('DNS server started on port 9999');
});

server.on('query', (query) => {
    var domain = query.name();
    var type = query.type();
    console.log('DNS Query: (%s) %s', type, domain);
    switch (type) {
        case 'A':
            var record = new named.ARecord('127.0.0.1');
            query.addAnswer(domain, record, 300);
            break;
        case 'AAAA':
            var record = new named.AAAARecord('::1');
            query.addAnswer(domain, record, 300);
            break;
        case 'CNAME':
            var record = new named.CNAMERecord('cname.example.com');
            query.addAnswer(domain, record, 300);
            break;
        case 'MX':
            var record = new named.MXRecord('smtp.example.com');
            query.addAnswer(domain, record, 300);
            break;
        case 'SOA':
            var record = new named.SOARecord('example.com');
            query.addAnswer(domain, record, 300);
            break;
        case 'SRV':
            var record = new named.SRVRecord('sip.example.com', 5060);
            query.addAnswer(domain, record, 300);
            break;
        case 'TXT':
            var record = new named.TXTRecord('hello world');
            query.addAnswer(domain, record, 300);
            break;
    }
    server.send(query);
});

server.on('clientError', (error) => {
    console.log("there was a clientError: %s", error);
});

server.on('uncaughtException', (error) => {
    console.log("there was an excepton: %s", error.message());
});
