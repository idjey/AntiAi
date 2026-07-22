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
});
