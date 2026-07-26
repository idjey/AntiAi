import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas } from 'canvas';
import { downscaleBoxFilter } from './resize';

async function computeHash144(buffer: Buffer): Promise<string> {
    const { data, info } = await sharp(buffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    // For 144-bit, we need at least 12x12. 32x32 gives us enough resolution.
    const downscaled = downscaleBoxFilter(data as any, info.width, info.height, 32, 32);
    // bits=12 => 12x12 blocks => 144 bits => 36 hex chars
    return blockhash.bmvbhash({ width: 32, height: 32, data: downscaled as any }, 12);
}

function hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 144;
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

function generateRandomFrame(): Buffer {
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = `hsl(${Math.random() * 360}, ${Math.random() * 100}%, ${Math.random() * 100}%)`;
    ctx.fillRect(0, 0, width, height);
    
    for (let j = 0; j < 15; j++) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 50%)`;
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 400, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas.toBuffer('image/png');
}

async function generateBaseImages() {
    const bases = [];
    for (let i = 0; i < 5; i++) { 
        bases.push(generateRandomFrame());
    }
    return bases;
}

async function generateTranscodes(original: Buffer) {
    const t720p = await sharp(original).resize(1280, 720).jpeg({ quality: 80 }).toBuffer();
    const t480p = await sharp(original).resize(854, 480).jpeg({ quality: 60 }).toBuffer();
    const t360p = await sharp(original).resize(640, 360).jpeg({ quality: 40 }).toBuffer();
    
    const tScreenRec = await sharp(original)
        .blur(1.5)
        .modulate({ brightness: 1.1, saturation: 0.9 })
        .resize(1280, 720)
        .jpeg({ quality: 70 })
        .toBuffer();

    return { t720p, t480p, t360p, tScreenRec };
}

async function run() {
    console.log('--- 1. Authentic Transcode Distances (144-bit) ---');
    const originalsForTranscode = await generateBaseImages();
    const transcodeDistances = [];
    
    for (let i = 0; i < originalsForTranscode.length; i++) {
        const transcodes = await generateTranscodes(originalsForTranscode[i]);
        const hOrig = await computeHash144(originalsForTranscode[i]);
        
        const h720 = await computeHash144(transcodes.t720p);
        const h480 = await computeHash144(transcodes.t480p);
        const h360 = await computeHash144(transcodes.t360p);
        const hScreenRec = await computeHash144(transcodes.tScreenRec);

        transcodeDistances.push(
            hammingDistance(hOrig, h720),
            hammingDistance(hOrig, h480),
            hammingDistance(hOrig, h360),
            hammingDistance(hOrig, hScreenRec)
        );
    }
    const maxAuthentic = Math.max(...transcodeDistances);
    console.log(`Max Authentic Distance: ${maxAuthentic}`);

    const NUM_VIDEOS = 100; 
    const FRAMES_PER_VIDEO = 3; // N=3, M=3

    console.log(`\nGenerating ${NUM_VIDEOS} synthetic videos, each with ${FRAMES_PER_VIDEO} frames...`);
    
    const videoHashes: string[][] = [];

    for (let i = 0; i < NUM_VIDEOS; i++) {
        const frames = [];
        for (let j = 0; j < FRAMES_PER_VIDEO; j++) {
            frames.push(generateRandomFrame());
        }
        const hashes = await Promise.all(frames.map(b => computeHash144(b)));
        videoHashes.push(hashes);
    }

    console.log(`\n--- Inter-Video Distances (False Positive Test, ${FRAMES_PER_VIDEO}x${FRAMES_PER_VIDEO} surface, 144-bit) ---`);
    const interDistances = [];
    
    for (let i = 0; i < videoHashes.length; i++) {
        for (let j = i + 1; j < videoHashes.length; j++) {
            const hashesA = videoHashes[i];
            const hashesB = videoHashes[j];
            
            let minDistanceBetweenAAndB = 144;
            
            for (let x = 0; x < hashesA.length; x++) {
                for (let y = 0; y < hashesB.length; y++) {
                    const dist = hammingDistance(hashesA[x], hashesB[y]);
                    if (dist < minDistanceBetweenAAndB) {
                        minDistanceBetweenAAndB = dist;
                    }
                }
            }
            
            interDistances.push(minDistanceBetweenAAndB);
        }
    }
    
    const overallMinInter = Math.min(...interDistances);
    const avgInter = Math.round(interDistances.reduce((a, b) => a + b, 0) / interDistances.length);

    console.log(`Total Unrelated Video Pairs Checked: ${interDistances.length}`);
    console.log(`Total Frame Comparisons Evaluated: ${interDistances.length * FRAMES_PER_VIDEO * FRAMES_PER_VIDEO}`);
    console.log(`Min Inter-Video Distance (False Positive Floor): ${overallMinInter}`);
    console.log(`Avg Inter-Video Distance: ${avgInter}`);
    
    console.log('\n--- Conclusion ---');
    if (overallMinInter > maxAuthentic) {
        console.log(`SUCCESS: The N=3 x M=3 false-positive floor is ${overallMinInter}, max authentic is ${maxAuthentic}!`);
        console.log(`Usable Threshold Window: [${maxAuthentic + 1} to ${overallMinInter - 1}]`);
    } else {
        console.log(`DANGER: The false-positive floor dropped to ${overallMinInter}! This is <= max authentic ${maxAuthentic}.`);
    }
}

run().catch(console.error);
