/*

   Quick and dirty wrapper for the `dig` command

*/

var exec = require('child_process').exec;
var assert = require('assert');

var DIG = '/usr/bin/dig';

var parseDig = function(output) {
  var lines = output.split(/\n/);
  var section = 'header';
  
  var results = {
    question: null,
    answers: [],
    additional: [],
    authority: []
  };

  var parseAnswer = function(tokens) {
    var t = tokens.filter(function(v) { if (v !== '') return v; });
    
    var r = {
      name:   t[0],
      ttl:    parseInt(t[1]),
      type:   t[3],
      target: t[4]
    }

    return r;
  }


  for (var i in lines) {
    var l = lines[i];

    if (l === '') {
      section = undefined;
    }
    else if (/^;; QUESTION SECTION:/.test(l)) {
      section = 'question';
    } 
    else if (/^;; ANSWER SECTION:/.test(l)) {
      section = 'answer';
    }
    else if (/^;; ADDITIONAL SECTION:/.test(l)) {
      section = 'additional';
    }
    else if (/^;; AUTHORITY SECTION:/.test(l)) {
      section = 'authority';
    }

    if (section === 'question') {
      if (/^;([A-Za-z0-9])*\./.test(l)) {
        results.question = l.match(/([A-Za-z0-9_\-\.])+/)[0];
      }
    }
   
    if (section === 'answer') {
      if (/^([_A-Za-z0-9])+/.test(l)) {
        var tokens = l.match(/(.*)/)[0].split(/\t/);
        var answer = parseAnswer(tokens);
        if (answer) 
          results.answers.push(answer);
      }
    }
  }

  return results;
}


var query = function(name, type, options, callback) {
  assert.ok(name);
  assert.ok(type);


  if (typeof(name) !== 'string')
    throw new TypeError('name (string) is required');

  if (typeof(type) !== 'string')
    throw new TypeError('type (string) is required');

  if (callback == undefined) {
    callback = options;
    options = {};
  }

  type = type.toUpperCase();

  var defaultOptions = '+time=1 +retry=0';
  var cmd = [DIG];
  if (options.server) cmd.push('@' + options.server);
  if (options.port) cmd.push('-p ' + options.port);
  
  cmd.push('-t ' + type);
  cmd.push(name);
  cmd.push(defaultOptions);

  
  var child = exec(cmd.join(' '), function(error, stdout, stderr) {
    if (error)
      return callback(error, null);

    return callback(null, parseDig(stdout));
  });
}


module.exports = query;
