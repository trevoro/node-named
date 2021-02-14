export class DnsError extends Error {
  code: number;

  constructor(name: string, code: number, msg: string, caller?: Function) {
    super();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, caller || DnsError);
    }
    this.code = code;
    this.name = name;

    this.message = msg || name;
  }
}

export class DnsProtocolError extends DnsError {
  constructor(message?: string, caller?: Function) {
    super(
      "DnsProtocolError",
      1,
      message ?? "Dns Protocol Error",
      caller ?? DnsProtocolError
    );
  }
}

export class DnsCannotProcessError extends DnsError {
  constructor(message?: string, caller?: Function) {
    super(
      "DnsCannotProcessError",
      2,
      message ?? "Dns Cannot Process",
      caller ?? DnsCannotProcessError
    );
  }
}

export class DnsNoNameError extends DnsError {
  constructor(message?: string, caller?: Function) {
    super(
      "DnsNoNameError",
      3,
      message ?? "Dns No Name",
      caller ?? DnsNoNameError
    );
  }
}

export class DnsNotImplementedError extends DnsError {
  constructor(message?: string, caller?: Function) {
    super(
      "DnsNotImplementedError",
      4,
      message ?? "Dns Not Implemented",
      caller ?? DnsNotImplementedError
    );
  }
}

export class DnsRefusedError extends DnsError {
  constructor(message?: string, caller?: Function) {
    super(
      "DnsRefusedError",
      5,
      message ?? "Dns Refused",
      caller ?? DnsRefusedError
    );
  }
}

export class DnsExceptionError extends DnsError {
  constructor(message?: string, caller?: Function) {
    super(
      "DnsExceptionError",
      6,
      message ?? "Dns Exception",
      caller ?? DnsExceptionError
    );
  }
}
