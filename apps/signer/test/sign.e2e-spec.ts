import * as request from 'supertest';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@antiai/database';
import { buildCanonicalPayload } from '@antiai/crypto';
import { server } from '../src/index';
import { mockClient } from 'aws-sdk-client-mock';
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';

const kmsMock = mockClient(KMSClient);

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
    
    kmsMock.on(SignCommand).resolves({
      Signature: new Uint8Array(64).fill(1) // Fake 64-byte Ed25519 signature
    });
    
    const signingKey = await prisma.signingKey.create({
      data: {
        id: `kid-${Date.now()}`,
        publicKeyB64: `pk-${Date.now()}`,
        isActive: true,
        alg: 'Ed25519',
        provider: 'aws_kms',
        providerKeyId: 'test-kms-key-id'
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
    kmsMock.restore();
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

    // VERIFY IT IGNORED FRAUDULENT DATA
    const parsedPayload = JSON.parse(Buffer.from(dbDerivedPayloadBytes).toString('utf-8'));
    expect(parsedPayload.content_hash).toBe(dbRecord.contentHash);
    expect(parsedPayload.youtube_video_id).toBe(testVideo.platformId);
    
    // We mocked KMS so we just expect the signature to match what our mock returns (64 bytes of 1s in base64url)
    const expectedSigB64 = Buffer.from(new Uint8Array(64).fill(1)).toString('base64');
    const expectedSigB64Url = expectedSigB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    expect(res.body.signatureB64).toBe(expectedSigB64Url);
  });

  it('enforces velocity limits keyed by kid', async () => {
    // We already made 1 successful sign above. Let's make more to hit the limit.
    // By default the limit is 500, but let's change the signingKey limit to 2 for this test
    const key = await prisma.signingKey.findFirst({ where: { id: dbRecord.kid }});
    await prisma.signingKey.update({
      where: { id: key!.id },
      data: { rateLimitMax: 2 }
    });

    // Request 2 (should succeed, count = 2)
    const res2 = await request(server.server)
      .post('/internal/sign')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ proofId: testProofId });
    expect(res2.status).toBe(200);

    // Request 3 (should fail, limit is 2)
    const res3 = await request(server.server)
      .post('/internal/sign')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ proofId: testProofId });
    expect(res3.status).toBe(429);
    expect(res3.body.error).toContain('Velocity limit exceeded');
  });
});
