import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { signProof } from '../../../packages/crypto/src/signing';
import { CryptoLookupService } from '../../api/src/modules/subjects/services/crypto-lookup.service';

test.describe('End-to-End Perceptual Lifecycle', () => {
  const prisma = new PrismaClient();
  
  test('issues proofs with fractional hashes and verifies transcode', async ({ page }) => {
    // 1. Prepare Real Fixture Video and Transcode
    const fixturesDir = path.resolve(__dirname, '../../../packages/phash/tests/fixtures');
    const originalVideoPath = path.join(fixturesDir, 'sync-test.mp4');
    const transcodedVideoPath = path.join(fixturesDir, 'sync-test-transcoded.mp4');
    
    // Create fixtures dir if not exists
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Generate a real 3-second test video with motion and detail
    const ffmpegPath = process.platform === 'win32' ? path.resolve(__dirname, '../../../ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe') : 'ffmpeg';
    // 1. Generate a real 3-second test video using a dynamic fractal zoom
    // mandelbrot guarantees that every frame is structurally unique across the entire 
    // image, guaranteeing distinct hashes across fractions 0.2, 0.5, and 0.8.
    // A 200ms transcode drift induces a 200ms forward shift in the fractal evolution,
    // which translates to a measurable Hamming distance > 0.
    if (!fs.existsSync(originalVideoPath)) {
      console.log('Generating original test video with mandelbrot zoom...');
      execSync(`"${ffmpegPath}" -f lavfi -i "mandelbrot=size=640x480:rate=30" -t 3 -c:v libx264 -pix_fmt yuv420p -y ${originalVideoPath}`);
    }

    // 2. Generate transcoded version (200ms front-trim, downscale to 480x360, lower bitrate for compression artifacts)
    if (!fs.existsSync(transcodedVideoPath)) {
      console.log('Generating transcoded test video...');
      execSync(`"${ffmpegPath}" -i ${originalVideoPath} -ss 0.2 -s 480x360 -b:v 200k -y ${transcodedVideoPath}`);
    }

    // 2. Creator Context - Hash Local Original Video
    // Navigate to localhost to establish origin and avoid canvas tainting
    await page.route('http://localhost/', route => route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' }));
    await page.goto('http://localhost/');
    
    page.on('console', msg => {
      console.log(`[Browser] ${msg.text()}`);
    });
    
    // Inject the bundled extraction function
    const extractBundlePath = path.resolve(__dirname, '../../../packages/phash/dist/extract.bundle.js');
    await page.addScriptTag({ path: extractBundlePath });

    // Read the videos into base64 to bypass Playwright route.fulfill Range request limitations
    // (Chromium disables seeking if the server doesn't respond with 206 Partial Content).
    const originalBase64 = fs.readFileSync(originalVideoPath).toString('base64');
    const transcodedBase64 = fs.readFileSync(transcodedVideoPath).toString('base64');

    // Execute real extraction in the browser context on the original video
    const creatorHashes = await page.evaluate(async (base64) => {
      const res = await fetch(`data:video/mp4;base64,${base64}`);
      const blob = await res.blob();
      // The bundle exposes PhashExtract globally
      const results = await (window as any).PhashExtract.extractFractionalSequence(blob);
      return results;
    }, originalBase64);

    console.log('Creator hashes:', creatorHashes);
    expect(creatorHashes.length).toBe(3);

    // 3. Database Scaffold
    const proofId = '00000000-0000-0000-0000-000000000001';
    
    // Clear out test data
    await prisma.$executeRaw`DELETE FROM proof_perceptual_hashes WHERE proof_id = ${proofId}::uuid`;
    await prisma.$executeRaw`DELETE FROM proofs WHERE id = ${proofId}::uuid`;
    
    // Insert mock user, channel, and video
    const userId = '00000000-0000-0000-0000-000000000005';
    const channelId = '00000000-0000-0000-0000-000000000010';
    const videoId = '00000000-0000-0000-0000-000000000020';

    await prisma.$executeRaw`
      INSERT INTO users (id, email, is_email_verified, verification_reminder_count, is_suspended, created_at, updated_at, failed_otp_attempts, two_factor_enabled)
      VALUES (${userId}::uuid, 'test@example.com', false, 0, false, NOW(), NOW(), 0, false)
      ON CONFLICT (id) DO NOTHING
    `;

    await prisma.$executeRaw`
      INSERT INTO channels (id, user_id, channel_name, platform_id, channel_url, verification_status, platform, updated_at)
      VALUES (${channelId}::uuid, ${userId}::uuid, 'Test Channel', 'UC123', 'https://youtube.com', 'verified', 'youtube', NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    await prisma.$executeRaw`
      INSERT INTO signing_keys (id, alg, public_key_b64, is_active, created_at)
      VALUES ('test-kid', 'Ed25519', 'test-pub-key', true, NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    await prisma.$executeRaw`
      INSERT INTO videos (id, title, platform_id, video_url, channel_id, platform)
      VALUES (${videoId}::uuid, 'Test Video', 'vid123', 'https://youtube.com/watch?v=vid123', ${channelId}::uuid, 'youtube')
      ON CONFLICT (id) DO NOTHING
    `;
    
    // Format perceptual hashes for signing (object keyed by fraction)
    const perceptualHashes: Record<string, string> = {};
    let perceptualHashVersion = 1;
    for (const ph of creatorHashes) {
      perceptualHashes[ph.fraction.toString()] = ph.hash;
      perceptualHashVersion = ph.version;
    }

    // 3. Issue Proof via real signProof implementation
    const signedProof = await signProof({
      kid: 'test-kid',
      youtubeVideoId: 'vid123',
      youtubeChannelId: 'UC123',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      privateKeyB64: Buffer.from('test-private-key-mock-that-is-at-least-32-bytes-long-for-ed25519-so-lets-pad-it-out-to-be-safe-12345678901234567890123456789012').toString('base64'),
      contentHash: undefined,
      perceptualHashes,
      perceptualHashVersion
    });

    // Insert mock proof (simulating ProofsService DB commit)
    await prisma.$executeRaw`
      INSERT INTO proofs (id, video_id, channel_id, kid, payload_json, payload_b64, signature_b64, expires_at, status)
      VALUES (${proofId}::uuid, ${videoId}::uuid, ${channelId}::uuid, ${signedProof.kid}, ${signedProof.payload_json}::jsonb, ${signedProof.payload_b64}, ${signedProof.signature_b64}, NOW() + INTERVAL '1 year', 'active')
    `;

    // Insert perceptual hashes
    for (const ph of creatorHashes) {
      await prisma.$executeRaw`
        INSERT INTO proof_perceptual_hashes (id, proof_id, anchor_fraction, phash_bits, version)
        VALUES (gen_random_uuid(), ${proofId}::uuid, ${ph.fraction}, ('x' || ${ph.hash})::bit(64), ${ph.version})
      `;
    }

    // 4. Platform Re-timing: Navigate to viewer page (using localhost to avoid cross-origin canvas tainting)
    await page.goto('about:blank');
    await page.addScriptTag({ path: extractBundlePath });

    // Execute real extraction in the browser context on the transcoded video
    const viewerHashes = await page.evaluate(async (base64) => {
      const res = await fetch(`data:video/mp4;base64,${base64}`);
      const blob = await res.blob();
      const results = await (window as any).PhashExtract.extractFractionalSequence(blob);
      return results;
    }, transcodedBase64);

    console.log('Viewer hashes:', viewerHashes);

    const cryptoLookup = new CryptoLookupService(prisma as any);
    const lookupResult = await cryptoLookup.lookupByPerceptualHash(viewerHashes, 12, 2);
    
    // Manually query the distances to print them out for the test log
    const distances: number[] = [];
    for (let i = 0; i < viewerHashes.length; i++) {
      const vh = viewerHashes[i];
      const res = await prisma.$queryRaw<any[]>`
        SELECT bit_count(phash_bits # ('x' || ${vh.hash})::bit(64)) as distance
        FROM proof_perceptual_hashes
        WHERE proof_id = ${proofId}::uuid AND anchor_fraction = ${vh.fraction}
      `;
      if (res.length > 0) distances.push(Number(res[0].distance));
    }
    console.log('Hamming Distances:', distances);
    console.log('Lookup Result:', lookupResult);
    expect(lookupResult).not.toBeNull();
    expect(lookupResult?.status).toBe('VERIFIED');
    expect(lookupResult?.channel?.name).toBe('Test Channel');
  });
});
