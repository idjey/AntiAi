import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas, loadImage } from 'canvas';

async function generateTestImage() {
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
    ctx.fillText('Testing Transcode', 100, 200);
    
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
    
    const transcodeBuffer = await sharp(originalBuffer)
        .resize(1280, 720)
        .jpeg({ quality: 75 })
        .toBuffer();

    return { originalBuffer, transcodeBuffer };
}

// Shared Area-Average (Box Filter) Downscale
function downscaleBoxFilter(data: Uint8ClampedArray, width: number, height: number, outWidth: number, outHeight: number) {
    const outData = new Uint8ClampedArray(outWidth * outHeight * 4);
    const blockWidth = width / outWidth;
    const blockHeight = height / outHeight;

    for (let y = 0; y < outHeight; y++) {
        for (let x = 0; x < outWidth; x++) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            
            const startY = Math.floor(y * blockHeight);
            const endY = Math.floor((y + 1) * blockHeight);
            const startX = Math.floor(x * blockWidth);
            const endX = Math.floor((x + 1) * blockWidth);

            for (let iy = startY; iy < endY; iy++) {
                for (let ix = startX; ix < endX; ix++) {
                    const idx = (iy * width + ix) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    a += data[idx + 3];
                    count++;
                }
            }
            
            const outIdx = (y * outWidth + x) * 4;
            if (count > 0) {
                outData[outIdx] = Math.round(r / count);
                outData[outIdx + 1] = Math.round(g / count);
                outData[outIdx + 2] = Math.round(b / count);
                outData[outIdx + 3] = Math.round(a / count);
            }
        }
    }
    return outData;
}

export async function computeSharedServer(buffer: Buffer): Promise<string> {
  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
    
  const downscaled = downscaleBoxFilter(data as any, info.width, info.height, 32, 32);
  return blockhash.bmvbhash({ width: 32, height: 32, data: downscaled as any }, 8);
}

export async function computeSharedClient(buffer: Buffer): Promise<string> {
  const img = await loadImage(buffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  
  const downscaled = downscaleBoxFilter(imgData.data, img.width, img.height, 32, 32);
  return blockhash.bmvbhash({ width: 32, height: 32, data: downscaled as any }, 8);
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
    const { originalBuffer, transcodeBuffer } = await generateTestImage();
    
    const serverHash = await computeSharedServer(originalBuffer);
    const clientHash = await computeSharedClient(transcodeBuffer);
    
    console.log(`Server (Original 1080p) : ${serverHash}`);
    console.log(`Client (Transcode 720p) : ${clientHash}`);
    console.log(`Distance: ${hammingDistance(serverHash, clientHash)}`);
}

run().catch(console.error);
