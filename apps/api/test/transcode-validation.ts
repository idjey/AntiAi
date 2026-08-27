import { execSync } from 'child_process';
import { computePhash, hammingDistance } from '@antiai/phash';
import * as fs from 'fs';
import * as path from 'path';

const THRESHOLD = 12;
const ANCHORS = [0.2, 0.5, 0.8];

async function getVideoDuration(filePath: string): Promise<number> {
    const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8' });
    return parseFloat(output.trim());
}

async function extractFrameBuffer(videoPath: string, time: number): Promise<Buffer> {
    const tempFile = path.join(process.cwd(), `temp_${Date.now()}_${Math.random()}.png`);
    try {
        execSync(`ffmpeg -y -ss ${time} -i "${videoPath}" -vframes 1 -q:v 2 "${tempFile}"`, { stdio: 'ignore' });
        const buffer = fs.readFileSync(tempFile);
        return buffer;
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
}

async function computeVideoHashes(videoPath: string): Promise<{ fraction: number, hash: string }[]> {
    const duration = await getVideoDuration(videoPath);
    const hashes: { fraction: number, hash: string }[] = [];
    
    for (const fraction of ANCHORS) {
        const time = duration * fraction;
        const frameBuffer = await extractFrameBuffer(videoPath, time);
        const hash = await computePhash(frameBuffer);
        hashes.push({ fraction, hash });
    }
    
    return hashes;
}

interface VariantResult {
    name: string;
    distances: number[];
    isMatch: boolean;
}

async function runSimulated() {
    console.log('--- RUNNING SIMULATED CORPUS ---');
    
    const corpusDir = path.join(__dirname, 'corpus');
    if (!fs.existsSync(corpusDir)) {
        console.error('Corpus directory not found:', corpusDir);
        return;
    }

    const files = fs.readdirSync(corpusDir).filter(f => f.endsWith('.mp4') && !f.includes('_1080p') && !f.includes('_720p') && !f.includes('_480p'));
    
    const allOrigHashes: { file: string, hashes: { fraction: number, hash: string }[] }[] = [];

    for (const file of files) {
        console.log(`\nProcessing Original: ${file}`);
        const originalPath = path.join(corpusDir, file);
        const origHashes = await computeVideoHashes(originalPath);
        allOrigHashes.push({ file, hashes: origHashes });
        
        // Generate simulated transcodes
        const variants = [
            { name: '1080p', scale: '1920:1080', crf: 23 },
            { name: '720p', scale: '1280:720', crf: 28 },
            { name: '480p', scale: '854:480', crf: 32 }
        ];

        const results: VariantResult[] = [];

        for (const variant of variants) {
            const variantPath = path.join(corpusDir, `${file}_${variant.name}.mp4`);
            console.log(`  Generating ${variant.name} variant...`);
            execSync(`ffmpeg -y -i "${originalPath}" -vf scale=${variant.scale} -c:v libx264 -crf ${variant.crf} -preset fast -c:a copy "${variantPath}"`, { stdio: 'ignore' });
            
            const varHashes = await computeVideoHashes(variantPath);
            
            const distances = origHashes.map((orig, i) => hammingDistance(orig.hash, varHashes[i].hash));
            const matchingAnchors = distances.filter(d => d <= THRESHOLD).length;
            const isMatch = matchingAnchors >= 2;
            
            results.push({ name: variant.name, distances, isMatch });
            
            // Cleanup simulated variant
            fs.unlinkSync(variantPath);
        }

        // Print Markdown Table
        console.log('\n| Variant | Anchor 0.2 Dist | Anchor 0.5 Dist | Anchor 0.8 Dist | Match (Y/N) |');
        console.log('|---------|-----------------|-----------------|-----------------|-------------|');
        for (const res of results) {
            console.log(`| ${res.name.padEnd(7)} | ${res.distances[0].toString().padEnd(15)} | ${res.distances[1].toString().padEnd(15)} | ${res.distances[2].toString().padEnd(15)} | ${res.isMatch ? 'Y' : 'N'}           |`);
        }
    }

    console.log('\n--- CROSS-CLIP COLLISION MATRIX ---');
    console.log('| Video A | Video B | Min Anchor Distance | Pass (> 12) |');
    console.log('|---------|---------|---------------------|-------------|');
    
    for (let i = 0; i < allOrigHashes.length; i++) {
        for (let j = i + 1; j < allOrigHashes.length; j++) {
            const clipA = allOrigHashes[i];
            const clipB = allOrigHashes[j];
            
            const distances = clipA.hashes.map((hashA, k) => hammingDistance(hashA.hash, clipB.hashes[k].hash));
            const minDistance = Math.min(...distances);
            const pass = minDistance > THRESHOLD;
            
            console.log(`| ${clipA.file.padEnd(7)} | ${clipB.file.padEnd(7)} | ${minDistance.toString().padEnd(19)} | ${pass ? 'Y' : 'N'}           |`);
        }
    }
}

async function runSpotCheck(originalFile: string, variantFiles: string[]) {
    console.log('--- RUNNING REAL YOUTUBE SPOT-CHECK ---');
    console.log(`Original: ${originalFile}`);
    const origHashes = await computeVideoHashes(originalFile);

    const results: VariantResult[] = [];

    for (const variantFile of variantFiles) {
        console.log(`\nEvaluating real variant: ${variantFile}`);
        const varHashes = await computeVideoHashes(variantFile);
        
        const distances = origHashes.map((orig, i) => hammingDistance(orig.hash, varHashes[i].hash));
        const matchingAnchors = distances.filter(d => d <= THRESHOLD).length;
        const isMatch = matchingAnchors >= 2;
        
        const name = path.basename(variantFile);
        results.push({ name, distances, isMatch });
    }

    console.log('\n| Variant | Anchor 0.2 Dist | Anchor 0.5 Dist | Anchor 0.8 Dist | Match (Y/N) |');
    console.log('|---------|-----------------|-----------------|-----------------|-------------|');
    for (const res of results) {
        console.log(`| ${res.name.padEnd(25)} | ${res.distances[0].toString().padEnd(15)} | ${res.distances[1].toString().padEnd(15)} | ${res.distances[2].toString().padEnd(15)} | ${res.isMatch ? 'Y' : 'N'}           |`);
    }
}

async function runRealCorpus() {
    console.log('--- RUNNING REAL YOUTUBE CORPUS ---');
    
    const corpusDir = path.join(__dirname, 'corpus');
    if (!fs.existsSync(corpusDir)) {
        console.error('Corpus directory not found:', corpusDir);
        return;
    }

    // Filter out the yt variants and local variants to find just the originals
    const originalFiles = fs.readdirSync(corpusDir).filter(f => f.endsWith('.mp4') && !f.includes('_yt_') && !f.includes('_1080p') && !f.includes('_720p') && !f.includes('_480p'));
    
    const allOrigHashes: { file: string, hashes: { fraction: number, hash: string }[] }[] = [];

    // 1. Match Logic (Authentic Transcodes)
    for (const file of originalFiles) {
        console.log(`\nProcessing Real Original: ${file}`);
        const originalPath = path.join(corpusDir, file);
        const origHashes = await computeVideoHashes(originalPath);
        allOrigHashes.push({ file, hashes: origHashes });
        
        const baseName = file.replace('.mp4', '');
        
        // Find corresponding YT variants
        const allFiles = fs.readdirSync(corpusDir);
        const ytVariants = allFiles.filter(f => f.startsWith(baseName + '_yt_') && f.endsWith('.mp4'));
        
        if (ytVariants.length === 0) {
            console.log(`  No YouTube variants found for ${file} (expected e.g., ${baseName}_yt_1080p.mp4)`);
            continue;
        }

        const results: VariantResult[] = [];
        for (const ytFile of ytVariants) {
            const variantPath = path.join(corpusDir, ytFile);
            const varHashes = await computeVideoHashes(variantPath);
            
            const distances = origHashes.map((orig, i) => hammingDistance(orig.hash, varHashes[i].hash));
            const matchingAnchors = distances.filter(d => d <= THRESHOLD).length;
            const isMatch = matchingAnchors >= 2;
            
            results.push({ name: ytFile, distances, isMatch });
        }

        console.log('\n| Variant | Anchor 0.2 Dist | Anchor 0.5 Dist | Anchor 0.8 Dist | Match (Y/N) |');
        console.log('|---------|-----------------|-----------------|-----------------|-------------|');
        for (const res of results) {
            console.log(`| ${res.name.padEnd(25)} | ${res.distances[0].toString().padEnd(15)} | ${res.distances[1].toString().padEnd(15)} | ${res.distances[2].toString().padEnd(15)} | ${res.isMatch ? 'Y' : 'N'}           |`);
        }
    }

    // 2. Collision Logic (Cross-Clip Guard)
    console.log('\n--- CROSS-CLIP COLLISION MATRIX (REAL CONTENT) ---');
    console.log('| Video A                   | Video B                   | Dist 0.2 | Dist 0.5 | Dist 0.8 | 2-of-3 Match? (FALSE POSITIVE) |');
    console.log('|---------------------------|---------------------------|----------|----------|----------|--------------------------------|');
    
    for (let i = 0; i < allOrigHashes.length; i++) {
        for (let j = i + 1; j < allOrigHashes.length; j++) {
            const clipA = allOrigHashes[i];
            const clipB = allOrigHashes[j];
            
            const distances = clipA.hashes.map((hashA, k) => hammingDistance(hashA.hash, clipB.hashes[k].hash));
            const matchingAnchors = distances.filter(d => d <= THRESHOLD).length;
            const isMatch = matchingAnchors >= 2;
            
            console.log(`| ${clipA.file.padEnd(25)} | ${clipB.file.padEnd(25)} | ${distances[0].toString().padEnd(8)} | ${distances[1].toString().padEnd(8)} | ${distances[2].toString().padEnd(8)} | ${isMatch ? 'Y (DANGER)' : 'N (SAFE)'}                       |`);
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--mode=simulated')) {
        await runSimulated();
    } else if (args.includes('--mode=real')) {
        const originalFile = args[args.indexOf('--mode=real') + 1];
        const variants = args.slice(args.indexOf('--mode=real') + 2);
        if (!originalFile || variants.length === 0) {
            console.error('Usage: npx ts-node transcode-validation.ts --mode=real <original.mp4> <variant1.mp4> [variant2.mp4 ...]');
            return;
        }
        await runSpotCheck(originalFile, variants);
    } else if (args.includes('--mode=real-corpus')) {
        await runRealCorpus();
    } else {
        console.log('Usage: npx ts-node transcode-validation.ts --mode=simulated');
        console.log('Usage: npx ts-node transcode-validation.ts --mode=real <original.mp4> <variant1.mp4> [variant2.mp4 ...]');
        console.log('Usage: npx ts-node transcode-validation.ts --mode=real-corpus');
    }
}

main().catch(console.error);
