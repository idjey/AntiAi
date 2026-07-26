import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas } from 'canvas';
import { downscaleBoxFilter } from './resize';

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

// Generate a completely random frame (to act as one sample in a sequence)
function generateRandomFrame(): Buffer {
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Random solid background
    ctx.fillStyle = `hsl(${Math.random() * 360}, ${Math.random() * 100}%, ${Math.random() * 100}%)`;
    ctx.fillRect(0, 0, width, height);
    
    // Random shapes
    for (let j = 0; j < 15; j++) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 50%)`;
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 400, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas.toBuffer('image/png');
}

async function run() {
    const NUM_VIDEOS = 100; // Generate 100 unrelated videos
    const FRAMES_PER_VIDEO = 3; // N=3, M=3

    console.log(`Generating ${NUM_VIDEOS} synthetic videos, each with ${FRAMES_PER_VIDEO} frames...`);
    
    // Each video is an array of 5 frame hashes
    const videoHashes: string[][] = [];

    for (let i = 0; i < NUM_VIDEOS; i++) {
        const frames = [];
        for (let j = 0; j < FRAMES_PER_VIDEO; j++) {
            frames.push(generateRandomFrame());
        }
        const hashes = await Promise.all(frames.map(b => computeHash(b)));
        videoHashes.push(hashes);
    }

    console.log(`\n--- Inter-Video Distances (False Positive Test, ${FRAMES_PER_VIDEO}x${FRAMES_PER_VIDEO} surface) ---`);
    const interDistances = [];
    
    for (let i = 0; i < videoHashes.length; i++) {
        for (let j = i + 1; j < videoHashes.length; j++) {
            const hashesA = videoHashes[i];
            const hashesB = videoHashes[j];
            
            // To falsely match A and B, ANY frame in A can match ANY frame in B
            let minDistanceBetweenAAndB = 64;
            
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
    if (overallMinInter > 12) {
        console.log(`SUCCESS: The N=5 x M=5 false-positive floor is ${overallMinInter}, which clears the threshold of 12!`);
    } else {
        console.log(`DANGER: The false-positive floor dropped to ${overallMinInter}! This is <= 12.`);
        console.log(`A 64-bit hash is too small for a 5x5 collision surface. We must increase to 256-bit or reduce frames.`);
    }
}

run().catch(console.error);
