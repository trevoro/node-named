var path = require('path');

var A = require(path.join(__dirname, 'records/a')).A;
var MX = require(path.join(__dirname, 'records/mx')).MX;
var SOA = require(path.join(__dirname, 'records/soa')).SOA;
var SRV = require(path.join(__dirname, 'records/srv')).SRV;
var TXT = require(path.join(__dirname, 'records/txt')).TXT;
var AAAA = require(path.join(__dirname, 'records/aaaa')).AAAA;
var CNAME = require(path.join(__dirname, 'records/cname')).CNAME;

module.exports = {
  SOA: SOA,
  SRV: SRV,
  MX: MX,
  A: A,
  AAAA: AAAA,
  CNAME: CNAME,
  TXT: TXT
};
