// query question types
global.QTYPE_A     = 0x01; // ipv4 address
global.QTYPE_NS    = 0x02; // nameserver
global.QTYPE_MD    = 0x03; // obsolete
global.QTYPE_MF    = 0x04; // obsolete
global.QTYPE_CNAME = 0x05; // alias
global.QTYPE_SOA   = 0x06; // start of authority
global.QTYPE_MB    = 0x07; // experimental
global.QTYPE_MG    = 0x08; // experimental
global.QTYPE_MR    = 0x09; // experimental
global.QTYPE_NULL  = 0x0A; // experimental null RR
global.QTYPE_WKS   = 0x0B; // service description
global.QTYPE_PTR   = 0x0C;                                        
global.QTYPE_HINFO = 0x0D; // host information
global.QTYPE_MINFO = 0x0E; // mailbox or mail list information
global.QTYPE_MX    = 0x0F; // mail exchange
global.QTYPE_TXT   = 0x10; // text strings
global.QTYPE_AAAA  = 0x1C; // ipv6 address
global.QTYPE_AXFR  = 0xFC; // request to transfer entire zone
global.QTYPE_MAILA = 0xFE; // request for mailbox related records
global.QTYPE_MAILB = 0xFD; // request for mail agent RRs
global.QTYPE_ANY   = 0xFF; // any class

// query classes
global.QCLASS_IN   = 0x01; // the internet
global.QCLASS_CS   = 0x02; // obsolete
global.QCLASS_CH   = 0x03; // chaos class. yes this actually exists
global.QCLASS_HS   = 0x04; // Hesiod

// rcodes
global.DNS_ENOERR  = 0x00; // No error
global.DNS_EFORMAT = 0x01; // Formatting Error
global.DNS_ESERVER = 0x02; // server it unable to process
global.DNS_ENONAME = 0x03; // name does not exist
global.DNS_ENOTIMP = 0x04; // feature not implemented on this server
global.DNS_EREFUSE = 0x05; // refused for policy reasons
