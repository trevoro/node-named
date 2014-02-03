var assert = require('assert');
var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Query = require('./query');
var DnsError = require('./errors');



///--- Globals

var sprintf = util.format;

var ExceptionError = DnsError.ExceptionError;
var ProtocolError = DnsError.ProtocolError;



///--- API

function Server(options) {
        if (typeof(options) !== 'object')
                throw new TypeError('options (object) is required');

        this._log = options.log.child({component: 'agent'}, true);
        this._name = options.name || "named";
        this._socket = null;

}
util.inherits(Server, EventEmitter);


Server.prototype.close = function close(callback) {
        if (typeof (callback) === 'function')
                this._socket.once('close', callback);

        this._socket.close();
};


Server.prototype.listen = function listen(port, address, callback) {
        if (!port)
                throw new TypeError('port (number) is required');

        if (typeof (address) === 'function' || !address) {
                callback = address;
                address = '0.0.0.0';
        }

        var self = this;

        this._socket = dgram.createSocket('udp6');
        this._socket.once('listening', function () {
                self.emit('listening');
                if (typeof (callback) === 'function')
                        process.nextTick(callback);
        });
        this._socket.on('close', function onSocketClose() {
                self.emit('close');
        });
        this._socket.on('error', function onSocketError(err) {
                self.emit('error', err);
        });
        this._socket.on('message', function (buffer, rinfo) {
                var decoded;
                var query;
                var raw = {
                        buf: buffer,
                        len: rinfo.size
                };

                var src = {
                        family: 'udp6',
                        address: rinfo.address,
                        port: rinfo.port
                };

                try {
                        decoded = Query.parse(raw, src);
                        query = Query.createQuery(decoded);
                } catch (e) {
                        self.emit('clientError',
                                  new ProtocolError('invalid DNS datagram'));
                }

                if (query === undefined || query === null) {
                        return;
                }

                query.respond = function respond() {
                        self.send(query);
                };

                try {
                        self.emit('query', query);
                } catch (e) {
                        self._log.warn({
                                err: e
                        }, 'query handler threw an uncaughtException');
                        self.emit('uncaughtException', e);
                }
        });
        this._socket.bind(port, address);
};


Server.prototype.send = function send(res) {
        assert.ok(res);

        try {
                res._flags.qr = 1;  // replace with function
                res.encode();
        } catch (e) {
                this._log.trace({err: e}, 'send: uncaughtException');
                var err = new ExceptionError('unable to encode response');
                this.emit('uncaughtException', err);
                return false;
        }

        var addr = res._client.address;
        var buf = res._raw.buf;
        var len = res._raw.len;
        var port = res._client.port;
        var self = this;

        this._log.trace({
                adddress: addr,
                port: port,
                len: len
        }, 'send: writing DNS message to socket');

        this._socket.send(buf, 0, len, port, addr, function (err, bytes) {
                if (err) {
                        self._log.warn({
                                adddress: addr,
                                port: port,
                                err: err
                        }, 'send: unable to send response');
                        self.emit('error', new ExceptionError(err.message));
                } else {
                        self._log.trace({
                                adddress: addr,
                                port: port
                        }, 'send: DNS response sent');
                        self.emit('after', res, bytes);
                }
        });
};


Server.prototype.toString = function toString() {
        var str = '[object named.Server <';
        str += sprintf('name=%s, ', this._name);
        str += sprintf('socket=%j', this._socket ? this._socket.address() : {});
        str += '>]';
        return (str);
};



///--- Exports

module.exports = Server;
