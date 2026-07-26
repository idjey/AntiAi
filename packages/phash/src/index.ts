import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { downscaleBoxFilter } from './resize';

export async function computePhash(buffer: Buffer): Promise<string> {
  // Decode and convert to raw pixels (full resolution)
  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  // Use the shared resampler to resize to 32x32 for parity with client canvas
  const downscaled = downscaleBoxFilter(
    data as unknown as Uint8Array, 
    info.width, 
    info.height, 
    32, 
    32
  );

  // blockhash expects rgba data and image width/height.
  // Using 8 bits on a 32x32 image yields an 8x8 block output = 64-bit hash.
  const hash = blockhash.bmvbhash(
    { width: 32, height: 32, data: downscaled as unknown as number[] },
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

export * from './resize';
export * from './constants';