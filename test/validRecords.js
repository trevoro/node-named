var path = require('path')
var record = require(path.join(__dirname, '../lib/record'));
var assert = require('assert');

console.log('>>> Testing record validators')

var a = new record.A('127.0.0.1');
console.log(' > A record: %s', a.valid());

var aaaa = new record.AAAA('::1');
console.log(' > AAAA record: %s', aaaa.valid());

var cname = new record.CNAME('alias.example.com');
console.log(' > CNAME record: %s', cname.valid());

var mx = new record.MX('smtp.example.com', {priority: 10, ttl: 8000})
console.log(' > MX record: %s', mx.valid());

var soa = new record.SOA('example.com', {serial: 12345, expire: 32000});
console.log(' > SOA record: %s', soa.valid());

var srv = new record.SRV('_sip._udp.example.com', 5600);
console.log(' > SRV record: %s', srv.valid());

var txt = new record.TXT('this is a test message');
console.log(' > TXT record: %s', txt.valid());


