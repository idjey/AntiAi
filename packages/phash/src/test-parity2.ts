import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

async function generateTestImage() {
    // Generate a random-ish 1280x720 image
    const width = 1280;
    const height = 720;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw some shapes
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(400, 300, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'green';
    ctx.fillRect(600, 200, 400, 400);

    const buffer = canvas.toBuffer('image/png');
    return buffer;
}

export async function computePhashSharp(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const hash = blockhash.bmvbhash(
    { width: info.width, height: info.height, data },
    8
  );
  return hash;
}

export async function computePhashCanvas(buffer: Buffer): Promise<string> {
  const img = await loadImage(buffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  
  const hash = blockhash.bmvbhash(
    { width: img.width, height: img.height, data: imgData.data },
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

async function run() {
    console.log('Generating test image...');
    const buffer = await generateTestImage();
    
    console.log('Computing hashes...');
    const hashSharp = await computePhashSharp(buffer);
    const hashCanvas = await computePhashCanvas(buffer);
    
    console.log(`Sharp hash : ${hashSharp}`);
    console.log(`Canvas hash: ${hashCanvas}`);
    
    const distance = hammingDistance(hashSharp, hashCanvas);
    console.log(`Hamming distance: ${distance}`);
    
    if (distance === 0) {
        console.log('PARITY MATCH!');
    } else {
        console.log('PARITY DRIFT!');
    }
}

run().catch(console.error);
