'use strict';

const assert = require('assert');
const dgram = require('dgram');
const EventEmitter = require('events');
const net = require('net');

const Query = require('./query');
const errors = require('./errors');

const ExceptionError = errors.ExceptionError;
const ProtocolError = errors.ProtocolError;


///--- API

class Server extends EventEmitter {
  constructor(options) {
    if (options === null || typeof (options) !== 'object')
      throw new TypeError('options (object) is required');

    super();

    this._log = options.log.child({component: 'agent'}, true);
    this._name = options.name || 'named';
    this._socket = null;
  }

  close(callback) {
    const socket = this._socket;

    if (socket === null) {
      if (typeof (callback) === 'function')
        process.nextTick(callback);
      return;
    }

    if (typeof (callback) === 'function')
      socket.once('close', callback);

    socket.close();
  }

  listen(port, address, callback) {
    if (!port)
      throw new TypeError('port (number) is required');

    if (typeof (address) === 'function' || !address) {
      callback = address;
      address = '0.0.0.0';
    }

    const type = net.isIPv6(address) ? 'udp6' : 'udp4';
    const socket = dgram.createSocket({type: type});

    socket.once('listening', () => {
      this.emit('listening');
      if (typeof (callback) === 'function')
        process.nextTick(callback);
    });
    socket.on('close', () => {
      if (this._socket === socket)
        this._socket = null;
      this.emit('close');
    });
    socket.on('error', (err) => {
      this.emit('error', err);
    });
    socket.on('message', (buffer, rinfo) => {
      this._onMessage(buffer, rinfo, type);
    });

    this._socket = socket;
    socket.bind(port, address);
  }

  _onMessage(buffer, rinfo, family) {
    let query;

    try {
      const decoded = Query.parse({
        buf: buffer,
        len: rinfo.size
      }, {
        family: family,
        address: rinfo.address,
        port: rinfo.port
      });
      query = Query.createQuery(decoded);
    } catch (e) {
      this.emit('clientError', new ProtocolError('invalid DNS datagram'));
      return;
    }

    query._server = this;

    try {
      this.emit('query', query);
    } catch (e) {
      this._log.warn({
        err: e
      }, 'query handler threw an uncaughtException');
      this.emit('uncaughtException', e);
    }
  }

  send(res) {
    assert.ok(res);

    try {
      res._flags.qr = 1;  // replace with function
      res.encode();
    } catch (e) {
      this._log.trace({err: e}, 'send: uncaughtException');
      this.emit('uncaughtException',
                new ExceptionError('unable to encode response'));
      return false;
    }

    const addr = res._client.address;
    const port = res._client.port;
    const buf = res._raw.buf;
    const log = this._log;

    log.trace({
      adddress: addr,
      port: port,
      len: res._raw.len
    }, 'send: writing DNS message to socket');

    this._socket.send(buf, port, addr, (err, bytes) => {
      if (err) {
        log.warn({
          adddress: addr,
          port: port,
          err: err
        }, 'send: unable to send response');
        this.emit('error', new ExceptionError(err.message));
      } else {
        log.trace({
          adddress: addr,
          port: port
        }, 'send: DNS response sent');
        this.emit('after', res, bytes);
      }
    });
  }

  toString() {
    const address = this._socket ? this._socket.address() : {};
    return '[object named.Server <name=' + this._name +
      ', socket=' + JSON.stringify(address) + '>]';
  }
}


///--- Exports

module.exports = Server;
