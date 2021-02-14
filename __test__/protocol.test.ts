import { equalBuffers, samples } from "./dnsbuffer";
import { decode, encode } from "../src";

samples.forEach((sample) => {
  test("protocol decode/encode: " + sample.description, () => {
    let decoded = decode(sample.raw, sample.type as any);
    let encoded = encode(decoded.val, sample.type as any);
    expect(equalBuffers(encoded, sample.raw)).toBe(true);
  });
});
