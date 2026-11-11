/*

  This file contains a bunch of sample DNS queries generated against namedjs
  using the 'dig' utility, as its the only tool that supports alternative ports
  when doing a query.

  When this module is loaded it will return an object containing an array of
  samples that you can use to test serializers, protocol generators, create a
  raw DNS client, etc.

  Each sample is an object with an 'id', 'description', 'raw',  and 'data'.
  The ID is used so that adding and removing samples out of order will not affect
  external  references to them in tests.

  The data is put through an encoder that will turn this string into a raw
  buffer. That way, samples may be loaded from file that can be read by a (mortal)
  human being.

  When the sample is encoded it places a "raw" value in the object. If you have one
  there it will be over-written.

*/

'use strict';

const samples = [
  {
    id: 0,
    description: 'query ns1.joyent.dev (A)',
    data: '0f 34 01 00 00 01 00 00 00 00 00 00 03 6e 73 31 06 6a 6f 79 65 ' +
      '6e 74 03 64 65 76 00 00 01 00 01',
    type: 'queryMessage'
  },
  {
    id: 1,
    description: 'query ns1.joyent.dev (AAAA)',
    data: 'b9 dd 01 00 00 01 00 00 00 00 00 00 03 6e 73 31 06 6a 6f 79 65 ' +
      '6e 74 03 64 65 76 00 00 1c 00 01',
    type: 'queryMessage'
  }
];

// turns a string of space separated hex bytes into a buffer
function encode(data) {
  if (typeof (data) !== 'string')
    throw new TypeError('data (string) is required');

  return Buffer.from(data.replace(/\s+/g, ''), 'hex');
}

for (const sample of samples)
  sample.raw = encode(sample.data);

module.exports = {
  samples: samples,
  encode: encode,
  equalBuffers: function equalBuffers(b1, b2) {
    return b1.equals(b2);
  }
};
