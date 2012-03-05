var fs = require('fs');
var path = require('path');

dbFile = fs.readFileSync('db.internal', 'utf8');

console.log(dbFile);
