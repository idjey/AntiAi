import { Injectable } from '@nestjs/common';
import { computePhash, hammingDistance } from '@antiai/phash';
import { MediaType } from '@prisma/client';

export const MACHINE_VERIFIABLE = new Set<MediaType>(['IMAGE']);

@Injectable()
export class PhashService {
  async compute(buffer: Buffer, mediaType: MediaType): Promise<string> {
    if (mediaType === 'IMAGE') {
      return computePhash(buffer);
    }

    if (mediaType === 'VIDEO') {
      throw new Error('Video pHash not yet implemented (deferred until ffmpeg integration)');
    }

    throw new Error(`pHash not supported for mediaType: ${mediaType}`);
  }
}

export { hammingDistance };
