import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { MediaType } from '@prisma/client';

export const MACHINE_VERIFIABLE = new Set<MediaType>(['IMAGE']);

@Injectable()
export class PhashService {
  async compute(buffer: Buffer, mediaType: MediaType): Promise<string> {
    if (mediaType === 'IMAGE') {
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

    if (mediaType === 'VIDEO') {
      throw new Error('Video pHash not yet implemented (deferred until ffmpeg integration)');
    }

    throw new Error(`pHash not supported for mediaType: ${mediaType}`);
  }
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
