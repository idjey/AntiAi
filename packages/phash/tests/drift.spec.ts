import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas } from 'canvas';
import { downscaleBoxFilter } from '../src/resize';
import { test, expect } from '@playwright/test';

test.describe('Perceptual Hashing Frame Drift Parity', () => {
  // Generate a frame with a moving object to simulate a video
  function generateFrameAtTime(timestampMs: number): Buffer {
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#87CEEB'; // sky blue
    ctx.fillRect(0, 0, width, height);

    // Ground
    ctx.fillStyle = '#228B22'; // forest green
    ctx.fillRect(0, 800, width, 280);

    // Motion: An object moving across the screen at 800 pixels per second
    // At timestampMs = 1000, x = 800
    // At timestampMs = 1200, x = 960 (shifted by 160 pixels)
    const speedPerMs = 800 / 1000;
    const objectX = (timestampMs * speedPerMs) % width;

    // The moving object (a large red truck)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(objectX, 600, 400, 200); // body
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(objectX + 100, 800, 50, 0, Math.PI * 2); // wheel 1
    ctx.arc(objectX + 300, 800, 50, 0, Math.PI * 2); // wheel 2
    ctx.fill();

    // A static object (sun)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(200, 200, 100, 0, Math.PI * 2);
    ctx.fill();

    // Text to add detail
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '100px Arial';
    ctx.fillText(`Timestamp: ${timestampMs}ms`, 100, 1000);
    
    // Noise to simulate texture
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 20000; i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 4, 4);
    }

    return canvas.toBuffer('image/png');
  }

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

  test('Simulate 200ms frame drift across transcode boundary', async ({ page }) => {
    // 1. Creator hashes the exact 1.0s frame (original local file)
    const originalBuffer = generateFrameAtTime(1000);
    const { data: serverData, info: serverInfo } = await sharp(originalBuffer)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });
      
    const serverDownscaled = downscaleBoxFilter(serverData as any, serverInfo.width, serverInfo.height, 32, 32);
    const creatorHash = blockhash.bmvbhash({ width: 32, height: 32, data: serverDownscaled as any }, 8);

    // 2. YouTube re-times the video by trimming the first 200ms.
    // So when the viewer extracts t=1.0s of the YouTube video, they are actually getting t=1.2s of the original.
    const driftedBuffer = generateFrameAtTime(1200);

    // 3. YouTube transcodes the video to 480p and compresses it
    const transcodeBuffer = await sharp(driftedBuffer)
      .resize(854, 480)
      .jpeg({ quality: 60 })
      .toBuffer();
    
    // 4. Viewer browser extracts and hashes the transcoded drifting frame
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

    const clientData = new Uint8ClampedArray(clientImgDataArray);
    const clientDownscaled = downscaleBoxFilter(clientData as any, 854, 480, 32, 32);
    const viewerHash = blockhash.bmvbhash({ width: 32, height: 32, data: clientDownscaled as any }, 8);

    const distance = hammingDistance(creatorHash, viewerHash);
    
    console.log(`Creator Hash (1000ms): ${creatorHash}`);
    console.log(`Viewer Hash (1200ms): ${viewerHash}`);
    console.log(`Computed Hamming Distance across 200ms Drift + Transcode: ${distance}`);
    
    // We will fail the test purposefully to see the actual distance output
    // Assuming the user is right, this distance will blow past 12.
    // expect(distance).toBeLessThanOrEqual(12);
  });
});
