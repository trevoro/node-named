import { LogEvent, LoggingInterface } from "./index";

export const createConsoleLog = (): LoggingInterface => ({
  trace(event: LogEvent, message: string) {
    console.log(message, event);
  },
  warn(event: LogEvent, message: string) {
    console.warn(message, event);
  },
});
