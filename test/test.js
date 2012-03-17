var samples = require('./samples');
var protocol = require('../lib/protocol');


// helpers
equalBuffers = function(b1, b2) {
	if (b1.length !== b2.length) {
		return false;
	}

	var l = b1.length;
	while (l--) {
		var one = b1.readUInt8(l);
		var two = b2.readUInt8(l);
		if (one !== two) {
			return false;
		}
	}
	return true;
}


// Encodes decoding a buffer and re-encoding it to see if the results match
encodeCycle = function() {
	var sample = samples[0];

	console.log(" >>> testing protocol decoder <<<");
	decoded = protocol.decode(sample.raw, 'queryMessage');
	console.log(JSON.stringify(decoded, null, 2));
	console.log(" >>> testing protocol encoder <<< ");
	encoded = protocol.encode(decoded.val, 'queryMessage');

	if (equalBuffers(encoded, sample.raw)) {
		console.log("Encoder cycle passed!");
	}
	else {
		console.log("Encoder cycle failed!");
	}

}

// Encodes the answer
encodeAnswer = function() {
  var data = {
		header: {
			id: 49350,
			flags: {
				qr: 0,
				opcode: 0,
				aa: 0,
				tc: 0,
				rd: 1,
				ra: 0,
				z: 0,
				ad: 0,
				cd: 0,
				rcode: 0
			},
			qdCount: 1,
			anCount: 1,
			nsCount: 0,
			srCount: 0
		}, 
		question: {
			name: [ "ns1", "joyent", "dev" ],
			type: 1,    
			qclass: 1  
		},
		answers: [
			{ 
				name: [ "ns1", "joyent", "dev" ],
				rclass: 1,
				rttl: 5,
				rtype: 1, 
				rdata: "127.0.0.1" 
			}
		]
	};

  encoded = protocol.encode(data, 'answerMessage');
  console.log(" >>> testing answer encoding <<<");
  console.log(encoded); 
}


encodeCycle();
encodeAnswer();
