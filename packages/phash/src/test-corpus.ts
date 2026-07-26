import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas } from 'canvas';

// Shared Box Filter Resampler
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

async function computeHash(buffer: Buffer): Promise<string> {
    const { data, info } = await sharp(buffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const downscaled = downscaleBoxFilter(data as any, info.width, info.height, 32, 32);
    return blockhash.bmvbhash({ width: 32, height: 32, data: downscaled as any }, 8);
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

async function generateBaseImages() {
    const bases = [];
    const width = 1920;
    const height = 1080;

    for (let i = 0; i < 5; i++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
        ctx.fillRect(0, 0, width, height);
        
        for (let j = 0; j < 10; j++) {
            ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 50%)`;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 400, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add random text
        ctx.fillStyle = 'white';
        ctx.font = '200px Arial';
        ctx.fillText(`Video Content ${i}`, 100, 500);

        bases.push(canvas.toBuffer('image/png'));
    }
    return bases;
}

async function generateTranscodes(original: Buffer) {
    const t720p = await sharp(original).resize(1280, 720).jpeg({ quality: 80 }).toBuffer();
    const t480p = await sharp(original).resize(854, 480).jpeg({ quality: 60 }).toBuffer();
    const t360p = await sharp(original).resize(640, 360).jpeg({ quality: 40 }).toBuffer();
    
    // Simulate slight crop (like aspect ratio fix)
    const tCrop = await sharp(original)
        .extract({ left: 100, top: 0, width: 1720, height: 1080 })
        .resize(1280, 720)
        .jpeg({ quality: 80 })
        .toBuffer();
        
    // Simulate screen record (slight color shift and blur)
    const tScreenRec = await sharp(original)
        .blur(1.5)
        .modulate({ brightness: 1.1, saturation: 0.9 })
        .resize(1280, 720)
        .jpeg({ quality: 70 })
        .toBuffer();

    return { t720p, t480p, t360p, tCrop, tScreenRec };
}

async function run() {
    console.log('Generating corpus...');
    const originals = await generateBaseImages();
    const originalHashes = await Promise.all(originals.map(b => computeHash(b)));

    console.log('\n--- 1. Authentic Transcode Distances (False Negative Test) ---');
    const transcodeDistances = [];
    for (let i = 0; i < originals.length; i++) {
        const transcodes = await generateTranscodes(originals[i]);
        const hOrig = originalHashes[i];
        
        const h720 = await computeHash(transcodes.t720p);
        const h480 = await computeHash(transcodes.t480p);
        const h360 = await computeHash(transcodes.t360p);
        const hCrop = await computeHash(transcodes.tCrop);
        const hScreenRec = await computeHash(transcodes.tScreenRec);

        transcodeDistances.push(
            hammingDistance(hOrig, h720),
            hammingDistance(hOrig, h480),
            hammingDistance(hOrig, h360),
            hammingDistance(hOrig, hScreenRec)
        );
        
        console.log(`Original ${i} vs 720p: ${hammingDistance(hOrig, h720)}`);
        console.log(`Original ${i} vs 480p: ${hammingDistance(hOrig, h480)}`);
        console.log(`Original ${i} vs 360p: ${hammingDistance(hOrig, h360)}`);
        console.log(`Original ${i} vs ScreenRec: ${hammingDistance(hOrig, hScreenRec)}`);
        console.log(`Original ${i} vs Crop (100px padding): ${hammingDistance(hOrig, hCrop)}`); // Informational, might be huge
    }
    console.log(`\nMax Authentic Distance (excluding Crop): ${Math.max(...transcodeDistances)}`);

    console.log('\n--- 2. Inter-Video Distances (False Positive Test) ---');
    const interDistances = [];
    for (let i = 0; i < originals.length; i++) {
        for (let j = i + 1; j < originals.length; j++) {
            const dist = hammingDistance(originalHashes[i], originalHashes[j]);
            interDistances.push(dist);
        }
    }
    console.log(`Min Inter-Video Distance (Unrelated Content): ${Math.min(...interDistances)}`);
    console.log(`Avg Inter-Video Distance: ${Math.round(interDistances.reduce((a, b) => a + b, 0) / interDistances.length)}`);
    
    console.log('\n--- Conclusion ---');
    const maxAuthentic = Math.max(...transcodeDistances);
    const minInter = Math.min(...interDistances);
    if (minInter > maxAuthentic) {
        console.log(`Usable Threshold Window: [${maxAuthentic + 1} to ${minInter - 1}]`);
    } else {
        console.log(`DANGER: Overlap detected! Max Authentic (${maxAuthentic}) >= Min Inter (${minInter}).`);
    }
}

run().catch(console.error);
