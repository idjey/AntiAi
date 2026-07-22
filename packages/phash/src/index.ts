import sharp from 'sharp';
import blockhash from 'blockhash-core';

export async function computePhash(buffer: Buffer): Promise<string> {
  // Decode, resize, and convert to raw pixels
  const { data, info } = await sharp(buffer)
    .resize(16, 16, { fit: 'fill' }) // blockhash-core expects square for best results
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  // blockhash expects rgba data and image width/height
  const hash = blockhash.bmvbhash(
    { width: info.width, height: info.height, data },
    8
  );
  return hash;
}

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Math.max(hash1.length, hash2.length) * 4;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const val1 = parseInt(hash1[i], 16);
    const val2 = parseInt(hash2[i], 16);
    let diff = val1 ^ val2;
    while (diff > 0) {
      distance += diff & 1;
      diff >>= 1;
    }
  }
  return distance;
}
