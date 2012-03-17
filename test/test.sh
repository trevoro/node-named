#!/bin/bash

SERVER='127.0.0.1'
PORT=9999
HOST='ns1.joyent.dev'
DIGOPTS="+time=1 +short +retry=0"

_fatal() {
  printf "(error) %s\n" "$@"
}

# lookup an A record
echo "[$SERVER:$PORT] 'ns1.joyent.dev' type: A"
out=$(dig @$SERVER -p $PORT -t A $HOST $DIGOPTS)
[[ $? -ne 0 ]] && _fatal "record lookup failed"

## lookup an CNAME
#echo "[$SERVER:$PORT] 'ns1.joyent.dev' type: CNAME"
#out=$(dig @$SERVER -p $PORT -t CNAME $HOST $DIGOPTS)
#[[ $? -ne 0 ]] && _fatal "record lookup failed"
#
## lookup a SOA 
#echo "[$SERVER:$PORT] 'joyent.dev' type: SOA"
#out=$(dig @$SERVER -p $PORT -t SOA joyent.dev $DIGOPTS)
#[[ $? -ne 0 ]] && _fatal "record lookup failed"

