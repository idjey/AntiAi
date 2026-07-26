import blockhash from 'blockhash-core';
import { downscaleBoxFilter } from '../../../packages/phash/src/resize';

export async function computePhashFromVideo(video: HTMLVideoElement): Promise<string> {
  const canvas = document.createElement('canvas');
  const width = video.videoWidth;
  const height = video.videoHeight;
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2D context");
  
  ctx.drawImage(video, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  
  // Downscale to 32x32 using the shared Box Filter for parity with server
  const downscaled = downscaleBoxFilter(imgData.data, width, height, 32, 32);
  
  // 32x32 area with 8-bit block size yields an 8x8 block output = 64 bits
  return blockhash.bmvbhash({ width: 32, height: 32, data: downscaled as unknown as number[] }, 8);
}
