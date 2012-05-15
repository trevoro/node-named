#!/bin/bash

SERVER='localhost'
PORT=9999
HOST='ns1.example.com'
DIGOPTS="+time=1 +short +retry=0"

_fatal() {
  printf "(error) %s\n" "$@"
}

# lookup an A record
printf "[%s:%s] '%s' type: %s" $SERVER $PORT 'ns1.example.com' 'A'
out=$(dig @$SERVER -p $PORT -t A ns1.example.com $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%30s\n" "OK"
fi

# lookup a CNAME record
printf "[%s:%s] '%s' type: %s" $SERVER $PORT 'www.example.com' 'CNAME'
out=$(dig @$SERVER -p $PORT -t CNAME www.example.com $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%30s\n" "OK"
fi

# lookup a SOA record
printf "[%s:%s] '%s' type: %s" $SERVER $PORT 'example.com' 'SOA'
out=$(dig @$SERVER -p $PORT -t SOA example.com $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%30s\n" "OK"
fi

# lookup MX records
printf "[%s:%s] '%s' type: %s" $SERVER $PORT 'example.com' 'MX'
out=$(dig @$SERVER -p $PORT -t MX example.com $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%30s\n" "OK"
fi

# lookup AAAA records
printf "[%s:%s] '%s' type: %s" $SERVER $PORT $HOST 'AAAA'
out=$(dig @$SERVER -p $PORT -t AAAA example.com $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%30s\n" "OK"
fi

# lookup SRV records
printf "[%s:%s] '%s' type: %s" $SERVER $PORT "_sip._tcp.example.com" 'SRV'
out=$(dig @$SERVER -p $PORT -t SRV _sip._tcp.example.com $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%30s\n" "OK"
fi
