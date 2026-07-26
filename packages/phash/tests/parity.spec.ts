import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas } from 'canvas';
import { downscaleBoxFilter } from '../src/resize';
import { test, expect } from '@playwright/test';

test.describe('Perceptual Hashing Parity', () => {
  let originalBuffer: Buffer;
  let transcodeBuffer: Buffer;

  test.beforeAll(async () => {
    // Generate a complex image
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(600, 400, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'green';
    ctx.fillRect(800, 300, 400, 500);
    ctx.fillStyle = 'yellow';
    ctx.font = '200px Arial';
    ctx.fillText('Testing Transcode Parity', 100, 200);
    
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50000; i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    originalBuffer = canvas.toBuffer('image/png');
    
    // Create a heavily compressed 480p transcode
    transcodeBuffer = await sharp(originalBuffer)
      .resize(854, 480)
      .jpeg({ quality: 60 })
      .toBuffer();
  });

  function hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 64;
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

  test('Server path (sharp) and Client path (Playwright Canvas) should have distance <= 12 across transcodes', async ({ page }) => {
    // Server path: sharp decoding original 1080p
    const { data: serverData, info: serverInfo } = await sharp(originalBuffer)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
      
    const serverDownscaled = downscaleBoxFilter(serverData as any, serverInfo.width, serverInfo.height, 32, 32);
    const serverHash = blockhash.bmvbhash({ width: 32, height: 32, data: serverDownscaled as any }, 8);

    // Client path: real browser canvas decoding transcode 480p
    
    // Load the transcode image directly into the browser
    const base64Img = transcodeBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Img}`;
    
    const clientImgDataArray = await page.evaluate(async (url) => {
      return new Promise<number[]>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No 2d context');
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          resolve(Array.from(imgData.data));
        };
        img.onerror = reject;
        img.src = url;
      });
    }, dataUrl);

    // Process the pixel array with the shared resampler
    const clientData = new Uint8ClampedArray(clientImgDataArray);
    const clientDownscaled = downscaleBoxFilter(clientData as any, 854, 480, 32, 32);
    const clientHash = blockhash.bmvbhash({ width: 32, height: 32, data: clientDownscaled as any }, 8);

    const distance = hammingDistance(serverHash, clientHash);
    
    console.log(`Computed Hamming Distance across Server/Browser boundary: ${distance}`);
    
    // The threshold window expects this to be well under 12.
    expect(distance).toBeLessThanOrEqual(12);
  });
});

