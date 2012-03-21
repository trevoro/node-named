var fs = require('fs');
var path = require('path');
var protocol = require('./protocol');

var Store = function(opts) {
	if (typeof(opts) !== 'object') {
		throw new TypeError('opts (object) is missing');
	}

  this._db = {};
  this._domains = {};
  this._dbFile = opts.dbFile
  
	var self = this;

}

Store.prototype._load = function _load() {
	var records;
  try {
  	records = JSON.parse(fs.readFileSync(this._dbFile, 'utf8'));
  }
  catch (err) {
    throw new Error("could not load file");
  }

  this._db = records;
  this._domains = records._domains;
  
  for (var i in this._domains) {
    var domain = this._domains[i];

    for (host in this._db[domain]['hosts']) {
      var rr = this._db[domain]['hosts'][host]; 

			for (x in rr) {
        var type = rr[x][0];
        switch(type) {
          case "A":
            rr[x][0] = protocol.QTYPE_A;
            break;
          case "AAAA":
            rr[x][0] = protocol.QTYPE_AAAA;
            break;
          case "CNAME":
            rr[x][0] = protocol.QTYPE_CNAME;
        }
      }
    }

  }

}

Store.prototype.add = function add (domain, record) {
	if (typeof(domain) !== 'string') {
		throw new TypeError('domain (string) is missing');
  }	
	if (typeof(record) !== 'object') {
		throw new TypeError('opts (object) is missing');
  }	
}

Store.prototype.del = function del (domain, record) {
	if (typeof(domain) !== 'string') {
		throw new TypeError('domain (string) is missing');
  }	
	if (typeof(record) !== 'object') {
		throw new TypeError('opts (object) is missing');
  }
}

Store.prototype.update = function update (domain, record) {
	if (typeof(domain) !== 'string') {
		throw new TypeError('domain (string) is missing');
  }	
	if (typeof(record) !== 'object') {
		throw new TypeError('opts (object) is missing');
  }
  // do we have the record already?

}

Store.prototype.get = function get (opts) {
  var host, domain, rr = [];
	
	if (typeof(opts) !== 'object') {
		throw new TypeError('opts (object) is missing');
	}
  
  host = opts.name[0];
  domain = opts.name.slice(1, opts.name.length).join('.');

  if (!this._db[domain]) {
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
			return { error: { code: protocol.DNS_ENOTIMP } };
      break;
    case protocol.QTYPE_SOA:
      // return the Start Of Authority record
			return { error: { code: protocol.DNS_ENOTIMP } };
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
