import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EventEmitter } from 'events';

// Mock ioredis, bullmq, bull to avoid connection errors during e2e tests
jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');
  RedisMock.Redis = RedisMock;
  RedisMock.default = RedisMock;
  return RedisMock;
});

jest.mock('bullmq', () => ({
  Queue: class { add = jest.fn(); on = jest.fn(); close = jest.fn(); },
  Worker: class { on = jest.fn(); close = jest.fn(); },
  QueueEvents: class { on = jest.fn(); close = jest.fn(); },
}));

jest.mock('bull', () => {
  return class {
    constructor() {}
    add = jest.fn();
    on = jest.fn();
    process = jest.fn();
    close = jest.fn();
  };
});

let globalPrismaService: any;
let mockSignerApp: any;

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('ProofsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let userId: string;
  let channelId: string;
  let videoId: string;

  beforeAll(async () => { console.log('DB URL:', process.env.DATABASE_URL);
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
    process.env.SIGNER_SERVICE_URL = 'http://127.0.0.1:4001';

    process.env.SIGNING_PRIVATE_KEY_B64 = 'c29tZS1mYWtlLWtleS10aGF0LWlzLTMyLWJ5dGVzLWxvbmc='; // valid 32 byte base64 key
    
    // Import and start the REAL signer instead of a mock!
    // Since index.ts calls start() automatically, this boots the real fastify app on port 4001
    mockSignerApp = require('../../signer/src/index.ts').server;
    await mockSignerApp.ready();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    globalPrismaService = prismaService;
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
    // Cascading cleanup of any orphaned data from previous runs
    const staleUsers = await prismaService.user.findMany({ where: { email: 'creator_e2e_proofs@example.com' } });
    for (const u of staleUsers) {
      const channels = await prismaService.channel.findMany({ where: { userId: u.id } });
      for (const ch of channels) {
        await prismaService.proofPerceptualHash.deleteMany({ where: { proof: { channelId: ch.id } } });
        await prismaService.proof.deleteMany({ where: { channelId: ch.id } });
        await prismaService.video.deleteMany({ where: { channelId: ch.id } });
      }
      await prismaService.channel.deleteMany({ where: { userId: u.id } });
      await prismaService.subscription.deleteMany({ where: { userId: u.id } });
    }
    await prismaService.user.deleteMany({ where: { email: 'creator_e2e_proofs@example.com' } });

    // Seed test user
    const user = await prismaService.user.create({
      data: {
        email: 'creator_e2e_proofs@example.com',
        isEmailVerified: true,
        role: 'creator',
      }
    });
    userId = user.id;

    // Seed subscription
    await prismaService.subscription.create({
      data: {
        userId,
        plan: 'pro',
        status: 'active',
        stripeCustomerId: 'cus_test',
        stripeSubscriptionId: 'sub_test',
      }
    });

    // Seed channel
    const channel = await prismaService.channel.create({
      data: {
        userId,
        channelName: 'E2E Test Channel',
        platformId: 'test_platform_id',
        verificationStatus: 'verified'
      }
    });
    channelId = channel.id;

    // Seed video
    const video = await prismaService.video.create({
      data: {
        channelId,
        platformId: 'test_video_id',
        title: 'E2E Test Video'
      }
    });
    videoId = video.id;

    // Seed signing key
    await prismaService.signingKey.upsert({
      where: { id: 'k_2026_01' },
      update: {},
      create: {
        id: 'k_2026_01',
        alg: 'Ed25519',
        publicKeyB64: 'mock_public_key_b64',
        isActive: true,
      }
    });
    
    authToken = jwtService.sign({ sub: user.id, email: user.email, role: user.role });

  });

  afterAll(async () => {
    await mockSignerApp.close();
    if (prismaService) {
      await prismaService.proof.deleteMany({ where: { channelId } });
      await prismaService.video.deleteMany({ where: { id: videoId } });
      await prismaService.channel.deleteMany({ where: { id: channelId } });
      await prismaService.subscription.deleteMany({ where: { userId } });
      await prismaService.user.deleteMany({ where: { id: userId } });
    }
    await app.close();
  });

  it('POST /proofs/issue - issues a proof with fractional hashes', async () => {
    const payload = {
      video_id: videoId,
      content_hash: 'some-content-hash',
      perceptual_hashes: [
        { fraction: 0.2, hash: "1e71f1c1c1e36173", version: 1 },
        { fraction: 0.5, hash: "3b61e1d1a3c3c1f1", version: 1 },
        { fraction: 0.8, hash: "f1e0e1f0e0e3c0f5", version: 1 }
      ]
    };

    const res = await request(app.getHttpServer())
      .post('/proofs/issue')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    if (res.status !== 200) {
      console.error(res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    
    const proofId = res.body.id;

    // Verify it was persisted correctly in DB
    const dbProof = await prismaService.proof.findUnique({
      where: { id: proofId },
      include: {
        perceptualHashes: true
      }
    });

    expect(dbProof).toBeDefined();
    
    // Check JSON payload
    const payloadJson = dbProof?.payloadJson as any;
    expect(payloadJson).toBeDefined();
    expect(payloadJson.perceptual_hashes).toEqual({
      "0.2": "1e71f1c1c1e36173",
      "0.5": "3b61e1d1a3c3c1f1",
      "0.8": "f1e0e1f0e0e3c0f5"
    });
    expect(payloadJson.perceptual_hash_version).toBe(1);

    // Check DB relation
    expect(dbProof?.perceptualHashes.length).toBe(3);
    
    const fractions = dbProof?.perceptualHashes.map((ph: any) => ph.anchorFraction).sort();
    expect(fractions).toEqual([0.2, 0.5, 0.8]);
  });
});
