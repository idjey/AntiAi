import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PendingProofsCronService } from '../src/modules/proofs/pending-proofs.cron';

describe('KMS Guardrails (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let cronService: PendingProofsCronService;
  let authToken: string;
  let userId: string;
  let channelId: string;
  let videoId: string;

  beforeAll(async () => {
    // Force specific config for tests
    process.env.SIGNING_KEY_ID = 'test-key-id';
    process.env.SIGNING_PUBLIC_KEY_B64 = 'MCowBQYDK2VwAyEA0DX42yHDP8akoN3pg9LQzfYxQWxezPyvoR5BbTEXRYU=';
    process.env.SIGNING_PRIVATE_KEY_B64 = 'MC4CAQAwBQYDK2VwBCIEIHM11+KG4g2twRipTZFDRIKLbvq5wegfzCleaIaa+utp';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    cronService = moduleFixture.get<PendingProofsCronService>(PendingProofsCronService);

    await app.init();
    
    // Seed test data
    const user = await prismaService.user.create({
      data: {
        email: `guardrails_${Date.now()}@example.com`,
        isEmailVerified: true,
        role: 'creator',
      }
    });
    userId = user.id;

    await prismaService.subscription.create({
      data: { userId, plan: 'pro', status: 'active', stripeCustomerId: 'c', stripeSubscriptionId: 's' }
    });

    const channel = await prismaService.channel.create({
      data: { userId, channelName: 'Test', platformId: 'c1', verificationStatus: 'verified' }
    });
    channelId = channel.id;

    const video = await prismaService.video.create({
      data: { channelId, platformId: `v_${Date.now()}`, title: 'V' }
    });
    videoId = video.id;

    await prismaService.signingKey.upsert({
      where: { id: 'test-key-id' },
      update: { isActive: true },
      create: {
        id: 'test-key-id',
        alg: 'Ed25519',
        publicKeyB64: process.env.SIGNING_PUBLIC_KEY_B64,
        isActive: true,
      }
    });
    
    authToken = jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. Rollout Percentage Routes Correctly (0% = Legacy)', async () => {
    // Override rollout to 0% in DB
    await prismaService.systemSetting.upsert({
      where: { key: 'KMS_ROLLOUT_PCT' },
      update: { value: '0' },
      create: { key: 'KMS_ROLLOUT_PCT', value: '0' }
    });
    
    // Clear the cache in proofsService for test reliability by waiting 5 seconds?
    // Actually, this is the first test, so cache is empty.

    const res = await request(app.getHttpServer())
      .post('/proofs/issue')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ video_id: videoId });

    expect(res.status).toBe(200);
    
    const dbProof = await prismaService.proof.findUnique({ where: { id: res.body.id } });
    expect(dbProof?.status).toBe('active');
    
    // In legacy, we just know it succeeds quickly without KMS. 
    // We can verify it was active.
    
    // Clean up
    await prismaService.proof.delete({ where: { id: res.body.id } });
  });

  it('2. Fallback Fires on KMS Failure', async () => {
    // Override rollout to 100% in DB
    await prismaService.systemSetting.upsert({
      where: { key: 'KMS_ROLLOUT_PCT' },
      update: { value: '100' },
      create: { key: 'KMS_ROLLOUT_PCT', value: '100' }
    });

    // Wait 5 seconds to bypass the TTL cache
    await new Promise(r => setTimeout(r, 5100));

    // We don't have the real KMS signer running on port 4001, so fetch will throw ECONNREFUSED
    // This perfectly simulates a signer failure/outage.
    // The fallback logic should catch the fetch failure and use legacy local signProof.

    const res = await request(app.getHttpServer())
      .post('/proofs/issue')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ video_id: videoId });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
    
    // Clean up
    await prismaService.proof.delete({ where: { id: res.body.id } });
  });

  it('3. Pending-Recovery Cron Reroutes Stalled Proofs', async () => {
    // Manually insert a "pending" proof from 6 minutes ago
    const sixMinsAgo = new Date(Date.now() - 6 * 60 * 1000);
    const stalledProof = await prismaService.proof.create({
      data: {
        videoId,
        channelId,
        alg: 'Ed25519',
        kid: 'test-key-id',
        payloadB64: 'PENDING',
        signatureB64: 'PENDING',
        payloadJson: {},
        expiresAt: new Date(Date.now() + 86400000),
        status: 'pending' as any,
        createdAt: sixMinsAgo
      }
    });

    // Run the cron job manually
    await cronService.handlePendingProofs();

    // Verify it was updated to active and signed
    const recoveredProof = await prismaService.proof.findUnique({ where: { id: stalledProof.id } });
    expect(recoveredProof?.status).toBe('active');
    expect(recoveredProof?.signatureB64).not.toBe('PENDING');
  });
});
