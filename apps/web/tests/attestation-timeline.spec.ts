import { test, expect } from '@playwright/test';
import { signAttestation, canonicalBytes } from '@antiai/attestation-core';
import * as base64js from 'base64-js';
import nacl from 'tweetnacl';

test.describe('Attestation Timeline', () => {
  test('verifies mathematical signature strictly client-side against direct bytes', async ({ page }) => {
    // Generate a real cryptographic identity and signature for the test
    const keyPair = nacl.sign.keyPair();
    const payload = {
      version: "1",
      subject: {
        hash: "subject-hash-123",
        mediaType: "video"
      },
      claim: {
        type: "provenance_found",
        payload: { sourceUrl: "https://example.com/source" }
      },
      attester: {
        keyId: "key-1",
        identityClass: "pseudonymous"
      },
      context: {
        domain: "public",
        timestamp: "2026-07-25T14:30:00.000Z",
        nonce: "random-nonce"
      }
    } as any;

    const signed = signAttestation(payload, keyPair.secretKey);
    const pubKeyB64 = base64js.fromByteArray(keyPair.publicKey);
    const payloadB64 = base64js.fromByteArray(canonicalBytes(payload));
    
    // Intercept the attestations API to serve three items:
    // 1. A valid item (green path)
    // 2. A tampered item with one flipped byte in the signature (red path)
    // 3. A legacy item with no payloadB64 (unavailable path)
    
    await page.route('**/v1/subjects/*', async route => {
      if (route.request().url().includes('/attestations')) return route.fallback();
      if (route.request().url().includes('/crypto-proof')) {
        return route.fulfill({ status: 404, json: null });
      }
      return route.fulfill({
        status: 200,
        json: { hash: 'subject-hash-123', perceptualHash: null, mediaType: 'VIDEO', attestationCount: 3 }
      });
    });

    await page.route('**/v1/subjects/*/attestations*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: 'att-1-valid',
              payloadHash: signed.payloadHash,
              version: '1',
              claimType: 'provenance_found',
              claimPayload: payload.claim.payload,
              receivedAt: new Date().toISOString(),
              signature: signed.signature,
              nonce: 'nonce-1',
              payloadB64: payloadB64,
              attester: {
                keyId: 'key-1',
                publicKey: pubKeyB64,
                status: 'ACTIVE'
              }
            },
            {
              id: 'att-2-tampered',
              payloadHash: signed.payloadHash,
              version: '1',
              claimType: 'artifact_flag',
              claimPayload: {},
              receivedAt: new Date().toISOString(),
              // Flip the first character of the signature to invalidate it
              signature: signed.signature.startsWith('A') ? 'B' + signed.signature.substring(1) : 'A' + signed.signature.substring(1),
              nonce: 'nonce-2',
              payloadB64: payloadB64,
              attester: {
                keyId: 'key-2',
                publicKey: pubKeyB64,
                status: 'ACTIVE'
              }
            },
            {
              id: 'att-3-legacy',
              payloadHash: signed.payloadHash,
              version: '1',
              claimType: 'context_note',
              claimPayload: {},
              receivedAt: new Date().toISOString(),
              signature: signed.signature,
              nonce: 'nonce-3',
              payloadB64: null, // Legacy: no bytes stored
              attester: {
                keyId: 'key-3',
                publicKey: pubKeyB64,
                status: 'ACTIVE'
              }
            }
          ]
        }
      });
    });



    await page.goto('http://localhost:3000/v/subject-hash-123');

    // Wait for the timeline to render 3 items
    await expect(page.getByRole('heading', { name: 'Community Attestations' })).toBeVisible();
    await expect(page.getByText('provenance_found')).toBeVisible();
    await expect(page.getByText('artifact_flag')).toBeVisible();
    await expect(page.getByText('context_note')).toBeVisible();

    // Verify item 1 (Valid)
    const btnValid = page.locator('div').filter({ hasText: 'provenance_found' }).getByRole('button', { name: 'Verify Signature' }).first();
    await btnValid.click();
    await expect(page.locator('div').filter({ hasText: 'provenance_found' }).getByText('Valid Signature')).toBeVisible();

    // Verify item 2 (Tampered)
    const btnTampered = page.locator('div').filter({ hasText: 'artifact_flag' }).getByRole('button', { name: 'Verify Signature' }).first();
    await btnTampered.click();
    await expect(page.locator('div').filter({ hasText: 'artifact_flag' }).getByText('Invalid Signature')).toBeVisible();

    // Verify item 3 (Legacy)
    await expect(page.locator('div').filter({ hasText: 'context_note' }).getByText('Verification unavailable (Legacy)')).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'context_note' }).getByRole('button', { name: 'Verify Signature' })).not.toBeVisible();
  });
});
