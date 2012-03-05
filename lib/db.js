var fs = require('fs');
var path = require('path');
var types = require('../lib/types');

var db = {};

// loosely generates an intermediate format that behaves like a rudimentary
// tree.
var load = function() {
  db = JSON.parse(fs.readFileSync('./db/test.db', 'utf8'));

  console.log("database loaded");

  for (var i = 0; i < db._domains.length; i++) {
    var domain = db._domains[i];

    for (host in db[domain]['hosts']) {
      var rr = db[domain]['hosts'][host]; 
      for (var x=0; x<rr.length; x++) {
        var type = rr[x][0];
        switch(type) {
          case "A":
            rr[x][0] = QTYPE_A;
            break;
          case "AAAA":
            rr[x][0] = QTYPE_AAAA;
            break;
          case "CNAME":
            rr[x][0] = QTYPE_CNAME;
        }
      }
    }

  }

}

var query = function(name, type, callback) {
  // host is the first position
  // domain is the rest
  var host = name[0];
  var domain = name.slice(1, name.length).join('.');

  if (!db[domain]) {
    return callback(DNS_ENONAME, null);
  }

  switch(type) {
    case QTYPE_A:
      // if A is requested then we return all A records associated
      // with a request. If the resource is a CNAME then we include
      // all the appropriate A records for the CNAME in the ADDITIONAL
      
      if (db[domain]['hosts'][host]) {
        var rr = db[domain]['hosts'][host];
        
        return callback(null, rr);
      } 
      else {
        return callback(DNS_ENONAME, null);
      }

      break;
    case QTYPE_CNAME:
      // if CNAME is requested we return the CNAME or "not found"
      // No additional records are returned
      return callback(DNS_ENOTIMP, null);

      break;
    case QTYPE_AAAA:
      // only return AAAA record or CNAME and associated AAAA records
      return callback(DNS_ENOTIMP, null);

      break;
    case QTYPE_TXT:
      // simply return the text string for the domain
      return callback(DNS_ENOTIMP, null);

      break;
    case QTYPE_NS:
      // return a list of all authoritative nameservers
      return callback(DNS_ENOTIMP, null);

      break;
    case QTYPE_MX:
      // return a list of all MX records and their priorities
      return callback(DNS_ENOTIMP, null);

      break;
    case QTYPE_SOA:
      // return the Start Of Authority record
      return (null db[domain]['soa']);
      break;
    case QTYPE_SPF:
      // return sender policy framework text
      return callback(DNS_ENOTIMP, null);

      break;
    default:
      // we dont support any other queries
      return callback(DNS_ENOTIMP, null);

      break;
  }
  
}

module.exports = {
  query: query,
  load: load
}
