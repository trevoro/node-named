#!/usr/bin/env node



// should be able to plug in another storage system

// in memory database for all records

/*

records are in the format:
name TTL CLASS TYPE data

ex 

google.com 100 IN A '142.55.31.1'

suggests a tree


var db = {
  com: {
    google: {
      soa: {
        host: "google.com",
        admin: "user@sin.org",
        serial: 0,
        refresh: 0,
        retry: 0,
        expire: 0,
        ttl: 0
      },
      hosts: { 
        www: { ttl: 5, a: '142.55.3.1', aaaa: "::1" }
      },
      mx: [
        { ttl: 600, pref: 40, host: "alt3.axpmx.l.google.com" }
      ],
      txt: [
        { ttl: 3000, data: "" }
      ],
      srv: []
    }
  },
}

console.log(JSON.stringify(db, null, 2)); 

*/
