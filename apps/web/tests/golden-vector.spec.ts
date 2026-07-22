import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Browser Cryptography Integrity', () => {
  test('should exactly reproduce the Node.js golden vectors', async ({ page }) => {
    // 1. Read golden vectors
    const goldenVectorPath = path.resolve(__dirname, '../../../packages/attestation-core/test/golden-vectors.json');
    const goldenVectorStr = fs.readFileSync(goldenVectorPath, 'utf-8');
    const fixture = JSON.parse(goldenVectorStr);

    // 2. Navigate to hidden test page
    await page.goto('/test/golden-vector');

    // 3. Execute signing in the browser engine
    const result = await page.evaluate(async ({ secretKey, payload }) => {
      // @ts-ignore
      return await window.runGoldenVectorTest(secretKey, payload);
    }, {
      secretKey: fixture.keys.privateKeyBase64,
      payload: fixture.envelope
    });

    // 4. Assert success
    expect(result.success).toBe(true);
    
    // 5. Assert byte-for-byte exact matches
    const signed = result.signed;
    expect(signed.payloadHash).toBe(fixture.expected.payloadHash);
    expect(signed.signature).toBe(fixture.expected.signatureBase64);
  });

  test('hashFile should compute identical SHA-256 for a 50MB file', async ({ page }) => {
    const crypto = await import('crypto');
    await page.goto('/test/golden-vector');

    // Create a 50MB buffer in Node
    const size = 50 * 1024 * 1024;
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
      buffer[i] = i % 256;
    }
    
    const expectedHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Execute hashFile in the browser
    // We pass the raw array across the Playwright bridge and construct the Blob there
    const result = await page.evaluate(async (size) => {
      const arr = new Uint8Array(size);
      for(let i=0; i<size; i++) arr[i] = i % 256;
      const blob = new Blob([arr]);
      // @ts-ignore
      return await window.runHashFileTest(blob);
    }, size);

    expect(result.success).toBe(true);
    expect(result.hash).toBe(expectedHash);
  });
});
