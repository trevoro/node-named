export interface ErrorLogEvent {
  err: any;
}

export interface SocketWriteLogEvent {
  address: string;
  port: number;
  err?: any;
  len?: number;
}

export type LogEvent = SocketWriteLogEvent | ErrorLogEvent;

export interface LoggingInterface {
  warn(event: LogEvent, message: string): void;

  trace(event: LogEvent, message: string): void;
}
