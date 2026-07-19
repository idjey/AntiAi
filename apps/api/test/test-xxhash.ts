import xxhash from 'xxhash-wasm';

async function test() {
  const { h64ToString, h64 } = await xxhash();
  console.log(h64ToString('hello world'));
  console.log(h64('hello world', 12345n));
}
test();
