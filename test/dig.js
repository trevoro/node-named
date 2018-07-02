// Quick and dirty 'dig' wrapper

var assert = require('assert');
var exec = require('child_process').exec;
var sprintf = require('util').format;

///--- Globals

var DIG = 'dig';

///--- Helpers

function parseAnswer(tokens) {
    var t = tokens.filter((v) => v !== '' ? v : undefined);

    var r = {
        name: t[0],
        ttl: parseInt(t[1], 10),
        type: t[3],
        target: t[4]
    }

    return (r);
}

function parseDig(output) {
    var lines = output.split(/\n/);
    var section = 'header';

    var results = {
        question: null,
        answers: [],
        additional: [],
        authority: []
    };

    lines.forEach((l) => {
        if (l === '') {
            section = undefined;
        } else if (/^;; QUESTION SECTION:/.test(l)) {
            section = 'question';
        } else if (/^;; ANSWER SECTION:/.test(l)) {
            section = 'answer';
        } else if (/^;; ADDITIONAL SECTION:/.test(l)) {
            section = 'additional';
        } else if (/^;; AUTHORITY SECTION:/.test(l)) {
            section = 'authority';
        }

        if (section === 'question' && /^;([A-Za-z0-9])*\./.test(l)) {
            results.question = l.match(/([A-Za-z0-9_\-\.])+/)[0];
        }

        if (section === 'answer' && /^([_A-Za-z0-9])+/.test(l)) {
            var tokens = l.match(/(.*)/)[0].split(/\t/);
            var answer = parseAnswer(tokens);
            if (answer) results.answers.push(answer);
        }
    });

    return (results);
}

///--- API

function dig(name, type, options, callback) {
    if (typeof (name) !== 'string')
        throw new TypeError('name (string) is required');
    if (typeof (type) !== 'string')
        throw new TypeError('type (string) is required');
    if (typeof (options) === 'function') {
        callback = options;
        options = {};
    }

    type = type.toUpperCase();

    var opts = '';
    if (options.server)
        opts += ' @' + options.server;
    if (options.port)
        opts += ' -p ' + options.port;

    var cmd = sprintf('dig %s -t %s %s +time=1 +retry=0', opts, type, name);
    exec(cmd, (err, stdout, stderr) => {
        if (err)
            return callback(err);

        return callback(null, parseDig(stdout));
    });
}

///--- Exports

module.exports = dig;