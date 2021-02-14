import * as validators from "../src/validators";

const toTest = {
  nsName: [
    ["example.com", true],
    ["0example.com", true],
    ["_example.com", false],
    ["0_example.com", false],
    ["-example.com", false],
    ["0-example.com", true],
    ["example-one.com", true],
    ["example-111.com", true],
    ["Example-111.com", true],
    ["a name with spaces", false],
  ],
  UInt32BE: [
    ["hello", false],
    ["12345", true],
    [4294967296, false],
    [10, true],
  ],
  UInt16BE: [
    ["hello", false],
    ["12345", true],
    [65536, false],
    [10, true],
  ],
  nsText: [["hello world", true]],
};

function testName(name: keyof typeof toTest) {
  toTest[name].forEach(([s, ok]) => {
    console.log(name, s, ok);
    expect((validators[name] as any)(s)).toBe(ok);
  });
}

test("testing validator (nsName)", () => {
  testName("nsName");
});

test("testing validator (UInt32BE)", () => {
  testName("UInt32BE");
});

test("testing validator (UInt16BE)", () => {
  testName("UInt16BE");
});

test("testing validator (nsText)", () => {
  testName("nsText");
});
