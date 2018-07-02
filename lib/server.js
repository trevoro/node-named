var assert = require('assert');
var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Query = require('./query');
var DnsError = require('./errors');

///--- API

//TODO: Document what these functions do
class Server extends EventEmitter {
    //TODO: JSDOC the options object
    /**
     * Start a Server
     * @param {object} options
     */
    constructor(options) {
        if (typeof (options) !== 'object')
            throw new TypeError('options (object) is required');

        this._log = options.log.child({ component: 'agent' }, true);
        this._name = options.name || "named";
        this._socket = null;
    }

    /**
     * 
     * @param {function} cb
     */
    close(cb) {
        if (typeof (cb) === 'function')
            this._socket.once('close', cb);

        this._socket.close();
    }

    /**
     * 
     * @param {number} port
     * @param {string} address
     * @param {function} cb
     */
    listen(port, address, cb) {
        if (!port)
            throw new TypeError('port (number) is required');

        if (typeof (address) === 'function' || !address) {
            cb = address;
            address = '0.0.0.0';
        }

        var self = this;

        this._socket = dgram.createSocket('udp6');
        this._socket.once('listening', function () {
            self.emit('listening');
            if (typeof (cb) === 'function')
                process.nextTick(cb);
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
                    new DnsError.DNSError(DnsError.DNS_PROTOCOL_ERROR, ('invalid DNS datagram'));
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
    }

    //TODO: document what res is
    /**
     * 
     * @param {any} res
     */
    send(res) {
        assert.ok(res);

        try {
            res._flags.qr = 1;  // replace with function
            res.encode();
        } catch (e) {
            this._log.trace({ err: e }, 'send: uncaughtException');
            var err = new DnsError.DNSError(DnsError.DNS_EXCEPTION, 'unable to encode response');
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
                self.emit('error', new DnsError.DNSError(DnsError.DNS_EXCEPTION, (err.message));
            } else {
                self._log.trace({
                    adddress: addr,
                    port: port
                }, 'send: DNS response sent');
                self.emit('after', res, bytes);
            }
        });
    }

    /**
     * Make the Class to a String
     */
    toString() {
        var str = '[object named.Server <';
        str += util.format('name=%s, ', this._name);
        str += util.format('socket=%j', this._socket ? this._socket.address() : {});
        str += '>]';
        return (str);
    }
}

///--- Exports

module.exports = Server;