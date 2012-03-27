var fs = require('fs');
var path = require('path');
var ipaddr = require('ipaddr.js');
var protocol = require('./protocol');

var Store = function(opts) {
	if (typeof(opts) !== 'object') {
		throw new TypeError('opts (object) is missing');
	}

  this._db = {};
  this._domains = {};
  this._dbFile = path.join(__dirname + '/' + opts.dbFile);
  
	var self = this;

}
  
var parseName = function (name) {
	if (typeof(name) !== 'string') 
		throw new TypeError('name (string) is required');

	// validate name XXX
  return name.split(/\./);
}

var parseIP4 = function (addr) {
	var d, t;
	if (typeof(addr) !== 'string')
		throw new TypeError('addr (string) is required');

	// turns a dotted-decimal address into a UInt32
	t = addr.split(/\./);
	d = (t[0] << 24 | t[1] << 16 | t[2] << 8 | t[3]);
  return d;
}

var parseIP6 = function (addr) {
	if (typeof(addr) !== 'string')
		throw new TypeError('addr (string) is required');
  var addr;

	try {
		addr = ipaddr.parse(addr);
		return addr.parts;
	}
	catch (e) {
		return false;
	}

}

Store.prototype._load = function _load() {
	var config;
  try {
  	config = JSON.parse(fs.readFileSync(this._dbFile, 'utf8'));
  }
  catch (err) {
    throw new Error("could not load db " + this._dbFile);
  }

	// validate domains XXX
  this._domains = config._domains;

  
  for (var i in config._domains) {
  	var name, hosts, records = {};
  
		name = config._domains[i];
  	records = config[name];
	
		// parse SOA record
    records.soa.host = parseName(records.soa.host);
    records.soa.admin = parseName(records.soa.admin);

    // parse NS records
    for (var i in records.ns) {
    	var r = records['ns'][i];
    	r.data = parseName(r.data);
		}

    // parse srv records
		for (var t in records.srv) {
			var s = records.srv[t];
			for (var i in s) {
				s[i].data = parseName(s[i].data);
			}
		}
	
		// parse MX
	  for (var i in records.mx) {
	  	var r = records['mx'][i];
	  	r.exchange = parseName(r.exchange);
	  }

    // parse Hosts
    for (var i in records.hosts) {
    	console.log("host: %s", i);
    	var h = records['hosts'][i];
    	for (var n in h) {
				var r = h[n];
				switch(r.type) {
					case "CNAME":
						r.type = protocol.QTYPE_CNAME;
						r.data = parseName(r.data);
						break;
					case "A":
						r.type = protocol.QTYPE_A;
						r.data = parseIP4(r.data);
						break;
					case "AAAA":
						r.type = protocol.QTYPE_AAAA;
						r.data = parseIP6(r.data);
						break
				}
			}
    }

    // add records to store db
    this._db[name] = records;

  }
}

Store.prototype.get = function get (opts) {
  var name, host, domain, rr = [];
	
	if (typeof(opts) !== 'object') {
		throw new TypeError('opts (object) is missing');
	}

	//XXX This wont work for names with more than one delimeter
  host = opts.name[0];
  domain = opts.name[opts.name.length - 2] + '.' + opts.name[opts.name.length - 1];

  if (!this._db[domain]) {
  	console.log(domain);
		return { error: { message: 'Non existent domain', code: protocol.DNS_ENONAME } };
  }

  switch(opts.type) {
    case protocol.QTYPE_A:
      // if A is requested then we return all A records associated
      // with a request. If the resource is a CNAME then we include
      // all the appropriate A records for the CNAME in the ADDITIONAL
     
      if (this._db[domain]['hosts'][host]) {
      	var t, results = [];
        t = this._db[domain]['hosts'][host];
        
        for (i in t) {
					var record = {
						name: opts.name,
						rtype: opts.type,
						rclass: t[i][0],
						rttl: t[i][2],
						rdata: t[i][1],
					}
					results.push(record);
        } 
        return { records: results };
      } 
      else {
				return { error: { message: 'No entry', code: protocol.DNS_ENONAME } };
      }
      break;
    case protocol.QTYPE_CNAME:
      // if CNAME is requested we return the CNAME or "not found"
      // No additional records are returned
      if (this._db[domain]['hosts'][host]) {
      	var t, result;
        t = this._db[domain]['hosts'][host];
        
				var result = {
					name: opts.name,
					rclass: 0x01,
					rtype: t[0][0],
					rttl: t[0][2],
					rdata: t[0][1],
				}
        return { records: [result] };
      } 
      else {
				return { error: { message: 'No entry', code: protocol.DNS_ENONAME } };
      }

			return { error: { message: 'Not Implemented', code: protocol.DNS_ENOTIMP } };
      break;
    case protocol.QTYPE_AAAA:
      // only return AAAA record or CNAME and associated AAAA records
			return { error: { code: protocol.DNS_ENOTIMP } };
      break;
    case protocol.QTYPE_TXT:
      // simply return the text string for the domain
			return { error: { code: protocol.DNS_ENOTIMP } };
      break;
    case protocol.QTYPE_NS:
      // return a list of all authoritative nameservers
			return { error: { code: protocol.DNS_ENOTIMP } };
      break;
    case protocol.QTYPE_MX:
      // return a list of all MX records and their priorities
      
      if (this._db[domain]['mx']) {
      	var t, results = [];
        t = this._db[domain]['mx'];
        
        for (i in t) {
					var record = {
						name: opts.name,
						rtype: opts.type,
						rclass: 0x01,
						rttl: t[i].ttl,
						rdata: t[i]
					}
					results.push(record);
        } 
        return { records: results };
      } 
      else {
				return { error: { message: 'No entry', code: protocol.DNS_ENONAME } };
      }

      break;
    case protocol.QTYPE_SOA:
      // return the Start Of Authority record
      var record;
      
      record = {
				name: domain.split(/\./),
				rtype: protocol.QTYPE_SOA,
				rclass: 0x01,
				rttl: 1000,
				rdata: this._db[domain]['soa']
			};
			
      return { records: [ record ] };
      break;
    case protocol.QTYPE_SPF:
      // return sender policy framework text
			return { error: { code: protocol.DNS_ENOTIMP } };
      break;
    default:
      // we dont support any other queries
			return { error: { message: 'Not Implemented', code: protocol.DNS_ENOTIMP } };
      break;
  }
  
}

// pseudo-singleton
var instance;

var createStore = function (opts) {
	var getStore = function () {
		if (instance === undefined)
			instance = new Store(opts)
		return instance;
	}
	return getStore();
};

module.exports = {
	createStore: createStore
};

var store = createStore({dbFile: '../db/new.db'});
store._load();

console.log(JSON.stringify(store._db, null, 2));
