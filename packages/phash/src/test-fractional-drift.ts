import sharp from 'sharp';
import blockhash from 'blockhash-core';
import { createCanvas } from 'canvas';
import { downscaleBoxFilter } from './resize';

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

    // (Removed random noise to isolate drift distance)

    return canvas.toBuffer('image/png');
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

async function testDrift(name: string, origDuration: number, frontTrim: number, endTrim: number, anchorFrac: number) {
    const origAnchorTime = origDuration * anchorFrac;
    const newDuration = origDuration - frontTrim - endTrim;
    const newAnchorTime = newDuration * anchorFrac;
    
    // The viewer extracts at newAnchorTime of the YouTube video.
    // In the original timeline, this corresponds to:
    const viewerOriginalTime = newAnchorTime + frontTrim;

    const creatorBuffer = generateFrameAtTime(origAnchorTime);
    // Simulate YouTube Transcode
    const viewerTranscode = await sharp(generateFrameAtTime(viewerOriginalTime))
        .resize(854, 480)
        .jpeg({ quality: 60 })
        .toBuffer();

    const hCreator = await computeHash(creatorBuffer);
    const hViewer = await computeHash(viewerTranscode);
    const dist = hammingDistance(hCreator, hViewer);
    
    console.log(`\n--- Scenario: ${name} ---`);
    console.log(`Original Duration: ${origDuration}ms | Front Trim: ${frontTrim}ms | End Trim: ${endTrim}ms`);
    console.log(`Anchor Fraction: ${anchorFrac * 100}%`);
    console.log(`Creator Absolute Time: ${origAnchorTime}ms`);
    console.log(`Viewer Absolute Time (Original Timeline): ${viewerOriginalTime}ms`);
    console.log(`Absolute Drift: ${Math.abs(viewerOriginalTime - origAnchorTime)}ms`);
    console.log(`Hamming Distance: ${dist}`);
    
    if (dist <= 12) {
        console.log(`Result: PASS (Distance ${dist} <= 12)`);
    } else {
        console.log(`Result: FAIL (Distance ${dist} > 12)`);
    }
}

async function run() {
    console.log("Evaluating Fractional Anchoring Drift Robustness...");
    
    await testDrift("10s Video, 200ms Front Trim", 10000, 200, 0, 0.5);
    await testDrift("5s Video, 200ms Front Trim", 5000, 200, 0, 0.5);
    await testDrift("10s Video, 200ms Front Trim, 90% Anchor", 10000, 200, 0, 0.9);
    await testDrift("10s Video, 200ms Front Trim, 10% Anchor", 10000, 200, 0, 0.1);
    
    // Non-proportional edit: 60s video with 2-second end trim (e.g. cutting off credits)
    await testDrift("60s Video, 2000ms End Trim", 60000, 0, 2000, 0.5);
    // Let's test a bumper: 10s video, 3000ms front trim (e.g. static title card added/removed)
    await testDrift("10s Video, 3000ms Bumper Trim", 10000, 3000, 0, 0.5);
}

run().catch(console.error);
