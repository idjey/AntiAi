import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

async function generateTestImage() {
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw some complex shapes to simulate a real video frame
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
    ctx.fillText('Testing Transcode', 100, 200);
    
    // Add some noise
    const imgData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < imgData.data.length; i += 4) {
        if (Math.random() > 0.9) {
            imgData.data[i] = 255;
            imgData.data[i+1] = 255;
            imgData.data[i+2] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);

    const originalBuffer = canvas.toBuffer('image/png');
    
    // Simulate transcode (resize to 1280x720 and compress with JPEG)
    const transcodeBuffer = await sharp(originalBuffer)
        .resize(1280, 720)
        .jpeg({ quality: 75 })
        .toBuffer();
        
    fs.writeFileSync('test-original.png', originalBuffer);
    fs.writeFileSync('test-transcode.jpg', transcodeBuffer);

    return { originalBuffer, transcodeBuffer };
}

// 1. Old Path: Sharp resize to 16x16
export async function computeOldServer(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .resize(16, 16, { fit: 'fill' })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  return blockhash.bmvbhash({ width: info.width, height: info.height, data }, 8);
}

// 2. Old Path Client: Canvas resize to 16x16
export async function computeOldClient(buffer: Buffer): Promise<string> {
  const img = await loadImage(buffer);
  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 16, 16);
  const imgData = ctx.getImageData(0, 0, 16, 16);
  return blockhash.bmvbhash({ width: 16, height: 16, data: imgData.data }, 8);
}

// 3. New Path: Full resolution directly to blockhash
export async function computeFullResServer(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  return blockhash.bmvbhash({ width: info.width, height: info.height, data }, 8);
}

// 4. New Path Client: Full resolution directly to blockhash
export async function computeFullResClient(buffer: Buffer): Promise<string> {
  const img = await loadImage(buffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  return blockhash.bmvbhash({ width: img.width, height: img.height, data: imgData.data }, 8);
}

// 5. Shared JS Downscale
function downscaleNearest(imgData: ImageData, outWidth: number, outHeight: number): ImageData {
    const outData = new Uint8ClampedArray(outWidth * outHeight * 4);
    const inWidth = imgData.width;
    const inHeight = imgData.height;
    
    for (let y = 0; y < outHeight; y++) {
        for (let x = 0; x < outWidth; x++) {
            const inX = Math.floor(x * inWidth / outWidth);
            const inY = Math.floor(y * inHeight / outHeight);
            
            const inIdx = (inY * inWidth + inX) * 4;
            const outIdx = (y * outWidth + x) * 4;
            
            outData[outIdx] = imgData.data[inIdx];
            outData[outIdx+1] = imgData.data[inIdx+1];
            outData[outIdx+2] = imgData.data[inIdx+2];
            outData[outIdx+3] = imgData.data[inIdx+3];
        }
    }
    return { data: outData, width: outWidth, height: outHeight } as any;
}

export async function computeSharedJsServer(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
    
  const downscaled = downscaleNearest({ data, width: info.width, height: info.height } as any, 16, 16);
  return blockhash.bmvbhash({ width: 16, height: 16, data: downscaled.data }, 8);
}

export async function computeSharedJsClient(buffer: Buffer): Promise<string> {
  const img = await loadImage(buffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  
  const downscaled = downscaleNearest(imgData as any, 16, 16);
  return blockhash.bmvbhash({ width: 16, height: 16, data: downscaled.data }, 8);
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
    console.log('Generating test image and 720p transcode...');
    const { originalBuffer, transcodeBuffer } = await generateTestImage();
    
    console.log('\n--- 1. Old Path (Sharp vs Canvas resize) ---');
    const oldServer = await computeOldServer(originalBuffer);
    const oldClient = await computeOldClient(transcodeBuffer);
    console.log(`Server (Original 1080p) : ${oldServer}`);
    console.log(`Client (Transcode 720p) : ${oldClient}`);
    console.log(`Distance: ${hammingDistance(oldServer, oldClient)}`);
    
    console.log('\n--- 2. Full Resolution Path (No Resize) ---');
    const fullServer = await computeFullResServer(originalBuffer);
    const fullClient = await computeFullResClient(transcodeBuffer);
    console.log(`Server (Original 1080p) : ${fullServer}`);
    console.log(`Client (Transcode 720p) : ${fullClient}`);
    console.log(`Distance: ${hammingDistance(fullServer, fullClient)}`);
    
    console.log('\n--- 3. Shared JS Downscale Path (Nearest Neighbor 16x16) ---');
    const sharedServer = await computeSharedJsServer(originalBuffer);
    const sharedClient = await computeSharedJsClient(transcodeBuffer);
    console.log(`Server (Original 1080p) : ${sharedServer}`);
    console.log(`Client (Transcode 720p) : ${sharedClient}`);
    console.log(`Distance: ${hammingDistance(sharedServer, sharedClient)}`);
}

run().catch(console.error);
