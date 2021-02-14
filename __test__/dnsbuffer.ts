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

const samplesRaw = [
  {
    id: 0,
    description: "query ns1.joyent.dev (A)",
    data:
      "0f 34 01 00 00 01 00 00 00 00 00 00 03 6e 73 31 06 6a 6f 79 65 " +
      "6e 74 03 64 65 76 00 00 01 00 01",
    type: "queryMessage",
  },
  {
    id: 1,
    description: "query ns1.joyent.dev (AAAA)",
    data:
      "b9 dd 01 00 00 01 00 00 00 00 00 00 03 6e 73 31 06 6a 6f 79 65 " +
      "6e 74 03 64 65 76 00 00 1c 00 01",
    type: "queryMessage",
  },
];

function encode(data: string) {
  const tokens = data.split(/\s/);
  const buffer = Buffer.allocUnsafe(tokens.length);
  let pos = 0;
  tokens.forEach((token) => {
    const t = "0x" + token;
    const v = parseInt(t);
    buffer.writeUInt8(v, pos++);
  });
  return buffer;
}

function encodeSamples(samples: typeof samplesRaw) {
  return samples.map((sample) => ({ ...sample, raw: encode(sample.data) }));
}

export function equalBuffers(b1: Buffer, b2: Buffer) {
  if (b1.length !== b2.length) {
    return false;
  }
  let l = b1.length;
  while (l--) {
    const one = b1.readUInt8(l);
    const two = b2.readUInt8(l);
    if (one !== two) {
      return false;
    }
  }
  return true;
}

export const samples = encodeSamples(samplesRaw);
