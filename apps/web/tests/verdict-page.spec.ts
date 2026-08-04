import { test, expect } from '@playwright/test';
import nacl from 'tweetnacl';
import * as base64js from 'base64-js';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function seedTestData(
  dummyHash: string,
  cryptoState: 'VALID' | 'TAMPERED_SIG' | 'MISMATCH_HASH' | 'REVOKED'
) {
  const userId = randomUUID();
  const channelId = randomUUID();
  const videoId = randomUUID();
  const kid = 'test-key-' + randomUUID();
  const proofId = randomUUID();

  // Create cryptographic material
  const keypair = nacl.sign.keyPair();
  const publicKeyB64 = base64js.fromByteArray(keypair.publicKey);
  
  // Decide what hash goes into the payload
  const payloadHash = cryptoState === 'MISMATCH_HASH' ? 'some_other_hash' : dummyHash;
  const payloadObj = { subject: { hash: payloadHash } };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadObj));
  const payloadB64 = base64js.fromByteArray(payloadBytes);

  let signatureBytes = nacl.sign.detached(payloadBytes, keypair.secretKey);
  let signatureB64 = base64js.fromByteArray(signatureBytes);

  if (cryptoState === 'TAMPERED_SIG') {
    signatureB64 = signatureB64.substring(0, signatureB64.length - 2) + 'a=';
  }

  // 1. Seed SigningKey
  await prisma.signingKey.create({
    data: {
      id: kid,
      publicKeyB64,
    }
  });

  // 2. Seed User -> Channel -> Video
  await prisma.user.create({
    data: {
      id: userId,
      email: `test-${randomUUID()}@example.com`,
      channels: {
        create: {
          id: channelId,
          channelName: 'Test Channel',
          platform: 'youtube',
          platformId: randomUUID(),
          videos: {
            create: {
              id: videoId,
              platform: 'youtube',
              platformId: randomUUID(),
            }
          }
        }
      }
    }
  });

  // 3. Seed Subject(s)
  const validPHash = '1234567890abcdef';
  
  if (cryptoState === 'MISMATCH_HASH') {
    // Create the original subject that the proof points to
    await prisma.subject.create({
      data: {
        hash: payloadHash,
        mediaType: 'VIDEO',
        perceptualHash: validPHash,
      }
    });
  }

  // Create the requested subject
  await prisma.subject.create({
    data: {
      hash: dummyHash,
      mediaType: 'VIDEO',
      perceptualHash: validPHash,
    }
  });

  // 4. Seed Proof
  await prisma.proof.create({
    data: {
      id: proofId,
      videoId,
      channelId,
      kid,
      payloadB64,
      payloadJson: payloadObj,
      signatureB64,
      contentHash: payloadHash, // Match the payload hash to simulate what the system extracted
      status: cryptoState === 'REVOKED' ? 'revoked' : 'active',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: cryptoState === 'REVOKED' ? new Date() : null,
    }
  });
}

test.describe('Verdict Page Cryptographic States', () => {

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('VERIFIED_AUTHENTIC state when signature and lifecycle are valid', async ({ page }) => {
    const dummyHash = 'mock-hash-' + randomUUID();
    await seedTestData(dummyHash, 'VALID');

    await page.goto(`http://localhost:3000/v/${dummyHash}`);
    await expect(page.locator('h2', { hasText: 'VERIFIED AUTHENTIC' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Cryptographically proven')).toBeVisible();
  });

  test('UNVERIFIED state when content hash mismatch (transcoded)', async ({ page }) => {
    const dummyHash = 'mock-hash-' + randomUUID();
    await seedTestData(dummyHash, 'MISMATCH_HASH');

    await page.goto(`http://localhost:3000/v/${dummyHash}`);
    await expect(page.locator('h2', { hasText: 'UNVERIFIED' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=It may be re-encoded, or it may be altered')).toBeVisible();
  });

  test('INVALID SIGNATURE state on invalid crypto', async ({ page }) => {
    const dummyHash = 'mock-hash-' + randomUUID();
    await seedTestData(dummyHash, 'TAMPERED_SIG');

    await page.goto(`http://localhost:3000/v/${dummyHash}`);
    await expect(page.locator('h2', { hasText: 'INVALID SIGNATURE' })).toBeVisible({ timeout: 15000 });
  });

  test('REVOKED BY CREATOR state', async ({ page }) => {
    const dummyHash = 'mock-hash-' + randomUUID();
    await seedTestData(dummyHash, 'REVOKED');

    await page.goto(`http://localhost:3000/v/${dummyHash}`);
    await expect(page.locator('h2', { hasText: 'REVOKED' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Creator withdrew it')).toBeVisible();
  });
});
