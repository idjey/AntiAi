import { test, expect } from '@playwright/test';
import nacl from 'tweetnacl';
import * as base64js from 'base64-js';

// Mock crypto proof matching a dummy hash
const dummyHash = 'mock-hash-123';
const payloadObj = { subject: { hash: dummyHash } };
const payloadStr = JSON.stringify(payloadObj);
const payloadBytes = new TextEncoder().encode(payloadStr);
const payloadB64 = base64js.fromByteArray(payloadBytes);

// Generate keypair
const keypair = nacl.sign.keyPair();
const publicKeyB64 = base64js.fromByteArray(keypair.publicKey);

// Sign payload
const signatureBytes = nacl.sign.detached(payloadBytes, keypair.secretKey);
const signatureB64 = base64js.fromByteArray(signatureBytes);

const validProofResponse = {
  payloadB64,
  signatureB64,
  contentHash: dummyHash,
  kid: 'test-key',
  publicKeyB64,
  lifecycle: {
    status: 'active',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    revokedAt: null,
    supersededAt: null,
  }
};

test.describe('Verdict Page Cryptographic States', () => {

  test('VERIFIED_AUTHENTIC state when signature and lifecycle are valid', async ({ page }) => {
    await page.route(`**/v1/subjects/${dummyHash}`, route => 
      route.fulfill({ json: { id: 1, hash: dummyHash, mediaType: 'video/mp4' } })
    );

    await page.route(`**/v1/subjects/${dummyHash}/crypto-proof`, route => 
      route.fulfill({ json: validProofResponse })
    );

    // Mock attestations
    await page.route(`**/v1/subjects/${dummyHash}/attestations`, route => 
      route.fulfill({ json: { items: [] } })
    );

    await page.goto(`http://localhost:3000/v/${dummyHash}`);
    await expect(page.locator('h2', { hasText: 'VERIFIED AUTHENTIC' })).toBeVisible();
    await expect(page.locator('text=Cryptographically proven')).toBeVisible();
  });

  test('UNVERIFIED state when content hash mismatch (transcoded)', async ({ page }) => {
    await page.route(`**/v1/subjects/${dummyHash}`, route => 
      route.fulfill({ json: { id: 1, hash: dummyHash, mediaType: 'video/mp4' } })
    );

    // Provide a valid signature but a DIFFERENT content hash in the payload
    const mismatchedProof = { ...validProofResponse, contentHash: 'some_other_hash' };

    await page.route(`**/v1/subjects/${dummyHash}/crypto-proof`, route => 
      route.fulfill({ json: mismatchedProof })
    );

    await page.route(`**/v1/subjects/${dummyHash}/attestations`, route => 
      route.fulfill({ json: { items: [] } })
    );

    await page.goto(`http://localhost:3000/v/${dummyHash}`);
    await expect(page.locator('h2', { hasText: 'UNVERIFIED' })).toBeVisible();
    await expect(page.locator('text=It may be re-encoded, or it may be altered')).toBeVisible();
  });

  test('INVALID SIGNATURE state on invalid crypto', async ({ page }) => {
    await page.route(`**/v1/subjects/${dummyHash}`, route => 
      route.fulfill({ json: { id: 1, hash: dummyHash, mediaType: 'video/mp4' } })
    );

    // Provide an invalid signature by flipping a byte
    const invalidSignatureB64 = signatureB64.substring(0, signatureB64.length - 2) + 'a=';

    await page.route(`**/v1/subjects/${dummyHash}/crypto-proof`, route => 
      route.fulfill({
        json: {
          ...validProofResponse,
          signatureB64: invalidSignatureB64
        }
      })
    );

    await page.route(`**/v1/subjects/${dummyHash}/attestations`, route => 
      route.fulfill({ json: { items: [] } })
    );

    await page.goto(`http://localhost:3000/v/${dummyHash}`);
    await expect(page.locator('h2', { hasText: 'INVALID SIGNATURE' })).toBeVisible();
  });

  test('REVOKED state when lifecycle is revoked', async ({ page }) => {
    await page.route(`**/v1/subjects/${dummyHash}`, route => 
      route.fulfill({ json: { id: 1, hash: dummyHash, mediaType: 'video/mp4' } })
    );

    await page.route(`**/v1/subjects/${dummyHash}/crypto-proof`, route => 
      route.fulfill({
        json: {
          ...validProofResponse,
          lifecycle: {
            ...validProofResponse.lifecycle,
            status: 'revoked',
            revokedAt: new Date().toISOString()
          }
        }
      })
    );

    await page.route(`**/v1/subjects/${dummyHash}/attestations`, route => 
      route.fulfill({ json: { items: [] } })
    );

    await page.goto(`http://localhost:3000/v/${dummyHash}`);
    await expect(page.locator('h2', { hasText: 'REVOKED' })).toBeVisible();
    await expect(page.locator('text=Creator withdrew it')).toBeVisible();
  });

});
