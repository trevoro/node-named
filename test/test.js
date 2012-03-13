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
