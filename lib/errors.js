var ERRORS = [];

class DNSError extends Error {
    /**
     * DNS Error
     * @param {string} code Wich type of DNS Error?
     * @param {string} msg Additional Infomation
     * @param {any} [caller]
     */
    constructor(code, msg, caller = null) {
        if (code.trim == "") return;
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, caller || DNSError);

        this.code = code;
        msg = `${code}: ${msg || "(nothing provided)"}`;

        this.message = msg;
    }
}

module.exports = {
    DNSError: DNSError,
    DnsError: DNSError,

    DNS_NO_ERROR: "",
    DNS_PROTOCOL_ERROR: "DNS Protocol Error",
    DNS_CANNOT_PROCESS: "DNS Cannot Process",
    DNS_NO_NAME: "DNS No Name",
    DNS_NOT_IMPLEMENTED: "DNS Not Implemented",
    DNS_REFUSED: "DNS Refused",
    DNS_EXCEPTION: "DNS Exception"
}