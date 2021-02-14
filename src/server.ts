import assert from "assert";
import dgram from "dgram";
import { EventEmitter } from "events";
import util from "util";
import Query, { createQuery, parse, QueryOptions } from "./query";
import { DnsExceptionError, DnsProtocolError } from "./errors";
import { TypedEmitter } from "./emitter";
import { LoggingInterface } from "./logging";

const sprintf = util.format;

export interface ServerOptions {
  name?: string;
  address?: string;
  port?: number;
  log?: LoggingInterface;
}

export interface ServerEvents {
  listening: () => void;
  close: () => void;
  error: (error: Error) => void;
  clientError: (error: DnsProtocolError) => void;
  query: (query: Query) => void;
  uncaughtException: (error: any) => void;
  after: (query: Query, bytes: number) => void;
}

export class Server extends (EventEmitter as new () => TypedEmitter<ServerEvents>) {
  private socket?: dgram.Socket;
  public readonly name: string;
  public readonly address?: string;
  public readonly port: number;
  private log?: LoggingInterface;

  constructor(options: ServerOptions = {}) {
    super();
    this.name = options.name || "named";
    this.address = options.address;
    this.port = options.port ?? 53;
    this.log = options.log;
  }

  close() {
    return new Promise((resolve) => {
      this.socket?.once("close", resolve);
      this.socket?.close();
    });
  }

  start(): Promise<this> {
    if (this.socket) return Promise.resolve(this);
    return new Promise((resolve) => {
      this.socket = dgram.createSocket("udp6");
      this.socket.once("listening", () => {
        this.emit("listening");
        (this as any).address = this.socket?.address().address;
        resolve(this);
      });
      this.socket.on("close", () => {
        this.socket = undefined;
        this.emit("close");
      });
      this.socket.on("error", (err) => this.emit("error", err));
      this.socket.on("message", (buffer, rinfo) => {
        let query: Query;
        const raw = {
          buf: buffer,
          len: rinfo.size,
        };

        try {
          let decoded = parse(raw, {
            family: "udp6",
            address: rinfo.address,
            port: rinfo.port,
          });
          assert(decoded);
          query = createQuery(decoded as QueryOptions);
        } catch (e) {
          this.emit(
            "clientError",
            new DnsProtocolError("invalid DNS datagram")
          );
          return;
        }
        query.respond = () => this.send(query);
        try {
          this.emit("query", query);
        } catch (e) {
          this.log?.warn(
            {
              err: e,
            },
            "query handler threw an uncaughtException"
          );
          this.emit("uncaughtException", e);
        }
      });
      this.socket.bind(this.port, this.address);
    });
  }

  send(res: Query) {
    assert.ok(res);

    try {
      res._flags.qr = 1; // replace with function
      res.encode();
    } catch (e) {
      this.log?.trace({ err: e }, "send: uncaughtException");
      this.emit(
        "uncaughtException",
        new DnsExceptionError("unable to encode response", e)
      );
      return false;
    }

    const addr = res._client.address;
    const buf = res._raw!.buf;
    const len = res._raw!.len;
    const port = res._client.port;

    this.log?.trace(
      {
        address: addr,
        port: port,
        len: len,
      },
      "send: writing DNS message to socket"
    );

    this.socket?.send(buf, 0, len, port, addr, (err, bytes) => {
      if (err) {
        this.log?.warn(
          {
            address: addr,
            port: port,
            err: err,
          },
          "send: unable to send response"
        );
        this.emit("error", new DnsExceptionError(err.message));
      } else {
        this.log?.trace(
          {
            address: addr,
            port: port,
          },
          "send: DNS response sent"
        );
        this.emit("after", res, bytes);
      }
    });
  }

  toString() {
    return sprintf(
      "[object named.Server <name=%s, socket=%j>]",
      this.name,
      this.socket ? this.socket.address() : {}
    );
  }
}
