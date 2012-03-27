#!/bin/bash

SERVER='localhost'
PORT=9999
HOST='ns1.relay.sh'
DIGOPTS="+time=1 +short +retry=0"

_fatal() {
  printf "(error) %s\n" "$@"
}

# lookup an A record
printf "[%s:%s] '%s' type: %s" $SERVER $PORT $HOST 'A'
out=$(dig @$SERVER -p $PORT -t A $HOST $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%20s\n" "OK"
fi

# lookup a CNAME record
printf "[%s:%s] '%s' type: %s" $SERVER $PORT $HOST 'CNAME'
out=$(dig @$SERVER -p $PORT -t CNAME $HOST $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%16s\n" "OK"
fi

# lookup a SOA record
printf "[%s:%s] '%s' type: %s" $SERVER $PORT $HOST 'SOA'
out=$(dig @$SERVER -p $PORT -t SOA relay.sh $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%18s\n" "OK"
fi

# lookup MX records
printf "[%s:%s] '%s' type: %s" $SERVER $PORT $HOST 'MX'
out=$(dig @$SERVER -p $PORT -t MX relay.sh $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%19s\n" "OK"
fi

# lookup AAAA records
printf "[%s:%s] '%s' type: %s" $SERVER $PORT $HOST 'AAAA'
out=$(dig @$SERVER -p $PORT -t AAAA relay.sh $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%17s\n" "OK"
fi

# lookup SRV records
printf "[%s:%s] '%s' type: %s" $SERVER $PORT "_sip._tcp.relay.sh" 'AAAA'
out=$(dig @$SERVER -p $PORT -t SRV _sip._tcp.relay.sh $DIGOPTS)
if [[ $? -ne 0 ]] ; then
	_fatal "record lookup failed"
else
	printf "%17s\n" "OK"
fi
