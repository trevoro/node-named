var named = require('../lib');
var server = named.createServer();

server.listen(9999, '127.0.0.1', () => {
    console.log('DNS server started on port 9999');
});

server.on('query', (query) => {
    var domain = query.name()
    var type = query.type();
    console.log('DNS Query: (%s) %s', type, domain);
    // If we do not add any answers to the query then the
    // result will be a 'null-answer' message. This is how
    // you send a "404" to a DNS client
    server.send(query);
});

server.on('clientError', (error) => {
    console.log("there was a clientError: %s", error);
});

server.on('uncaughtException', (error) => {
    console.log("there was an excepton: %s", error.message());
});