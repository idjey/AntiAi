import { Test, TestingModule } from '@nestjs/testing';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CryptoLookupService } from './crypto-lookup.service';
import { execSync } from 'child_process';

describe('CryptoLookupService (Integration)', () => {
  let container: StartedPostgreSqlContainer | null = null;
  let prisma: PrismaService;
  let service: CryptoLookupService;

  beforeAll(async () => {
    let dbUrl = process.env.DATABASE_URL;

    // Start Postgres testcontainer only if no external DB is provided
    if (!dbUrl) {
      const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
      container = await new PostgreSqlContainer('postgres:15-alpine').start();
      dbUrl = container.getConnectionUri();
    }

    // Create a throwaway Prisma client and run migrations
    const tempPrisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    
    process.env.DATABASE_URL = dbUrl;
    const path = require('path');
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    execSync(`${npxCmd} prisma migrate deploy`, { 
      cwd: path.resolve(__dirname, '../../../../../../packages/database'),
      env: process.env, 
      stdio: 'ignore'
    });

    await tempPrisma.$disconnect();

    // Now set up the NestJS module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoLookupService,
        {
          provide: PrismaService,
          useValue: new PrismaClient({ datasources: { db: { url: dbUrl } } }),
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    await prisma.$connect();
    service = module.get<CryptoLookupService>(CryptoLookupService);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    await prisma.proof.deleteMany();
    await prisma.video.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.user.deleteMany();
  });

  it('calculates correct distances for proofs, returning matches <= 12 and rejecting >= 22', async () => {
    const probe = '0000000000000000';
    const dist12 = 'fff0000000000000'; // 12 bits diff (3 hex chars 'f')
    const dist22 = 'fffffc0000000000'; // 22 bits diff (5 hex chars 'f' + 'c' (2 bits))
    
    // Set up relational data needed by findUnique in the service
    const user = await prisma.user.create({ data: { email: 'test@example.com', passwordHash: 'hash', role: 'creator', profile: { create: { displayName: 'Test User' } } } });
    const channel = await prisma.channel.create({ data: { platformId: 'UC123', platformType: 'YOUTUBE', channelName: 'Test Channel', userId: user.id, verificationStatus: 'verified' } });
    const video = await prisma.video.create({ data: { platformId: 'v123', title: 'Video', url: 'https://youtube.com/watch?v=v123', channelId: channel.id } });
    
    // Create proofs
    const proof12 = await prisma.proof.create({
      data: {
        videoId: video.id,
        channelId: channel.id,
        alg: 'Ed25519',
        kid: 'key1',
        payloadJson: {},
        payloadB64: 'b64_1',
        signatureB64: 'sig_1',
        contentHash: 'content1',
        perceptualHash: dist12,
        expiresAt: new Date(Date.now() + 100000),
        status: 'active'
      }
    });

    const proof22 = await prisma.proof.create({
      data: {
        videoId: video.id,
        channelId: channel.id,
        alg: 'Ed25519',
        kid: 'key2',
        payloadJson: {},
        payloadB64: 'b64_2',
        signatureB64: 'sig_2',
        contentHash: 'content2',
        perceptualHash: dist22,
        expiresAt: new Date(Date.now() + 100000),
        status: 'active'
      }
    });

    // Test with distance 12
    const result12 = await service.lookupByPerceptualHash(probe, 12);
    expect(result12).toBeDefined();
    expect(result12?.status).toBe('VERIFIED');

    // Remove proof12 to test proof22 in isolation
    await prisma.proof.delete({ where: { id: proof12.id } });

    // Test with distance 12, should not return proof22
    const result22 = await service.lookupByPerceptualHash(probe, 12);
    expect(result22).toBeNull();
  });

  it('never returns a proof with placeholder pHash p:1100110011001100', async () => {
    const user = await prisma.user.create({ data: { email: 'test@example.com', passwordHash: 'hash', role: 'creator', profile: { create: { displayName: 'Test User' } } } });
    const channel = await prisma.channel.create({ data: { platformId: 'UC123', platformType: 'YOUTUBE', channelName: 'Test Channel', userId: user.id, verificationStatus: 'verified' } });
    const video = await prisma.video.create({ data: { platformId: 'v123', title: 'Video', url: 'https://youtube.com/watch?v=v123', channelId: channel.id } });
    
    await prisma.proof.create({
      data: {
        videoId: video.id,
        channelId: channel.id,
        alg: 'Ed25519',
        kid: 'key1',
        payloadJson: {},
        payloadB64: 'b64_1',
        signatureB64: 'sig_1',
        contentHash: 'content1',
        perceptualHash: 'p:1100110011001100', // 18 chars, should evaluate to NULL phash_bits
        expiresAt: new Date(Date.now() + 100000),
        status: 'active'
      }
    });

    // Query with an exact matching 16-char sub-string just in case
    const probe = '1100110011001100'; 
    const result = await service.lookupByPerceptualHash(probe, 12);
    
    // The placeholder should not be queryable because it was cast to NULL in the index
    expect(result).toBeNull();
  });
});
