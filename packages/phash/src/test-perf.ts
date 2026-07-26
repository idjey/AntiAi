import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas, loadImage } from 'canvas';

async function generateTestImage() {
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw some noise to ensure a complex hash
    const id = ctx.createImageData(width, height);
    for (let i = 0; i < id.data.length; i += 4) {
        id.data[i] = Math.random() * 255;
        id.data[i+1] = Math.random() * 255;
        id.data[i+2] = Math.random() * 255;
        id.data[i+3] = 255;
    }
    ctx.putImageData(id, 0, 0);

    const buffer = canvas.toBuffer('image/png');
    return buffer;
}

export async function computePhashCanvas(buffer: Buffer): Promise<string> {
  const img = await loadImage(buffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  
  const start = Date.now();
  const hash = blockhash.bmvbhash(
    { width: img.width, height: img.height, data: imgData.data },
    8
  );
  const end = Date.now();
  console.log(`Blockhash-core on ${img.width}x${img.height} took ${end - start}ms`);
  
  return hash;
}

async function run() {
    const buffer = await generateTestImage();
    const hashCanvas = await computePhashCanvas(buffer);
}

run().catch(console.error);
