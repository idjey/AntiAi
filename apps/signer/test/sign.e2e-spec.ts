import * as request from 'supertest';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@antiai/database';
import { buildCanonicalPayload } from '@antiai/crypto';
import { server } from '../src/index';

const prisma = new PrismaClient();
const INTERNAL_SIGNER_SECRET = process.env.INTERNAL_SIGNER_SECRET || 'dev-internal-secret';

describe('Signer Service (e2e)', () => {
  let authToken: string;
  let testProofId: string;
  let validToken: string;
  let dbRecord: any;
  let dbDerivedPayloadBytes: Uint8Array;
  let testVideo: any;

  beforeAll(async () => {
    await server.ready();
    validToken = jwt.sign({ service: 'api' }, INTERNAL_SIGNER_SECRET, { expiresIn: '5m' });

    // Using an existing generic user as attester for tests, or creating one
    const user = await prisma.user.create({
      data: { email: `test-${Date.now()}@example.com`, role: 'creator', isEmailVerified: true }
    });
    
    const signingKey = await prisma.signingKey.create({
      data: {
        id: `kid-${Date.now()}`,
        publicKeyB64: `pk-${Date.now()}`,
        isActive: true,
        alg: 'Ed25519',
      }
    });

    const channel = await prisma.channel.create({
      data: {
        userId: user.id,
        platform: 'YOUTUBE',
        platformId: `channel-${Date.now()}`,
        channelName: 'Test Channel',
        verificationStatus: 'verified'
      }
    });

    const video = await prisma.video.create({
      data: {
        channelId: channel.id,
        platform: 'YOUTUBE',
        platformId: `video-${Date.now()}`,
        title: 'Test Video'
      }
    });
    testVideo = video;

    const proof = await prisma.proof.create({
      data: {
        videoId: video.id,
        channelId: channel.id,
        alg: 'Ed25519',
        kid: signingKey.id,
        payloadB64: 'PENDING',
        signatureB64: 'PENDING',
        payloadJson: {},
        contentHash: 'real-db-content-hash',
        expiresAt: new Date(Date.now() + 86400 * 1000), // 1 day
        status: 'pending' as any // We patched Prisma to include pending
      }
    });

    testProofId = proof.id;

    // independently calculate what the bytes SHOULD be if the signer fetches strictly from DB
    const expiresAtUnix = Math.floor(proof.expiresAt.getTime() / 1000);
    const { payloadBytes } = buildCanonicalPayload({
      kid: proof.kid,
      youtubeVideoId: video.platformId,
      youtubeChannelId: channel.platformId,
      expiresAtUnix,
      contentHash: proof.contentHash || undefined
    });
    
    dbDerivedPayloadBytes = payloadBytes;
    dbRecord = proof;
  });

  afterAll(async () => {
    await server.close();
    await prisma.$disconnect();
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(server.server)
      .post('/internal/sign')
      .send({ proofId: testProofId });
    expect(res.status).toBe(401);
  });

  it('rejects invalid proofIds', async () => {
    const res = await request(server.server)
      .post('/internal/sign')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ proofId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  it('RED TEAM: signer derives hash strictly from DB, ignoring fraudulent request data', async () => {
    // We send extra data in the request body
    const res = await request(server.server)
      .post('/internal/sign')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        proofId: testProofId,
        contentHash: 'FRAUDULENT_CONTENT_HASH',
        youtubeVideoId: 'FRAUDULENT_VIDEO_ID'
      });

    expect(res.status).toBe(200);
    expect(res.body.signatureB64).toBeDefined();

    // Verify DB was updated
    const updatedProof = await prisma.proof.findUnique({
      where: { id: testProofId }
    });
    
    expect(updatedProof).toBeDefined();
    expect(updatedProof!.signatureB64).toBe(res.body.signatureB64);
    expect((updatedProof as any).status).toBe('active');

    // ASSERTION: Verify the output signature was generated over the DB derived bytes, not the fraudulent ones.
    // If it used 'FRAUDULENT_CONTENT_HASH' or 'FRAUDULENT_VIDEO_ID', the verification against dbDerivedPayloadBytes would fail.
    const crypto = require('crypto');
    
    // Convert signature back to bytes
    const sigB64 = res.body.signatureB64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((res.body.signatureB64.length + 3) % 4);
    const sigBytes = Buffer.from(sigB64, 'base64');

    // We must fetch the public key for the stub's seed to verify. 
    // Wait, the stub signs using process.env.SIGNING_PRIVATE_KEY_B64
    const privB64 = process.env.SIGNING_PRIVATE_KEY_B64;
    if (!privB64) throw new Error("Missing SIGNING_PRIVATE_KEY_B64");
    
    const rawKey = Buffer.from(privB64, 'base64');
    const priv32 = rawKey.length === 32 ? rawKey : rawKey.slice(0, 32);
    
    const privateKey = crypto.createPrivateKey({
      key: Buffer.concat([
        Buffer.from('302e020100300506032b657004220420', 'hex'), // DER prefix for Ed25519
        priv32
      ]),
      format: 'der',
      type: 'pkcs8'
    });
    const pubKeyObj = crypto.createPublicKey(privateKey);

    // We MUST use the one saved in the DB to verify the signature, because it contains a random nonce generated at signing time.
    const updatedPayloadB64Url = updatedProof!.payloadB64;
    const b64 = updatedPayloadB64Url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((updatedPayloadB64Url.length + 3) % 4);
    const dbDerivedPayloadBytes = Buffer.from(b64, 'base64');
    
    // VERIFY IT IGNORED FRAUDULENT DATA
    const parsedPayload = JSON.parse(dbDerivedPayloadBytes.toString('utf-8'));
    expect(parsedPayload.content_hash).toBe(dbRecord.contentHash);
    expect(parsedPayload.youtube_video_id).toBe(testVideo.platformId);
    
    const isValid = crypto.verify(null, dbDerivedPayloadBytes, pubKeyObj, sigBytes);
    
    expect(isValid).toBe(true);
  });
});
