import { Test, TestingModule } from '@nestjs/testing';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubjectPhashRepository } from './subject-phash.repository';
import { execSync } from 'child_process';

describe('SubjectPhashRepository (Integration)', () => {
  let container: StartedPostgreSqlContainer | null = null;
  let prisma: PrismaService;
  let repository: SubjectPhashRepository;

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
    
    // We run the actual prisma migrate command against the testcontainer
    // Note: this uses the CLI directly to ensure the raw SQL is applied
    process.env.DATABASE_URL = dbUrl;
    const path = require('path');
    execSync('npx prisma migrate deploy', { 
      cwd: path.resolve(__dirname, '../../../../../../packages/database'),
      env: process.env, 
      stdio: 'ignore',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
    });

    await tempPrisma.$disconnect();

    // Now set up the NestJS module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectPhashRepository,
        {
          provide: PrismaService,
          useValue: new PrismaClient({ datasources: { db: { url: dbUrl } } }),
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    await prisma.$connect();
    repository = module.get<SubjectPhashRepository>(SubjectPhashRepository);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    await prisma.subject.deleteMany();
  });

  it('calculates correct distances and filters by media type', async () => {
    const probe = '0000000000000000';
    // 0 bits diff
    const dist0 = '0000000000000000';
    // 4 bits diff (1 hex char 'f' = 4 bits)
    const dist4 = 'f000000000000000';
    // 8 bits diff (2 hex chars 'f')
    const dist8 = 'ff00000000000000';
    // 9 bits diff (2 hex chars 'f' + 1 bit '8')
    const dist9 = 'ff80000000000000';

    await prisma.subject.createMany({
      data: [
        { hash: 'hash0', perceptualHash: dist0, mediaType: 'IMAGE' },
        { hash: 'hash4', perceptualHash: dist4, mediaType: 'IMAGE' },
        { hash: 'hash8', perceptualHash: dist8, mediaType: 'IMAGE' },
        { hash: 'hash9', perceptualHash: dist9, mediaType: 'IMAGE' },
        { hash: 'hash0v', perceptualHash: dist0, mediaType: 'VIDEO' }, // Wrong media type
      ],
    });

    const results = await repository.nearest(probe, 'IMAGE', 8);

    expect(results).toHaveLength(3);
    
    // Results should be ordered by distance ascending
    expect(results[0].hash).toBe('hash0');
    expect(results[0].distance).toBe(0);

    expect(results[1].hash).toBe('hash4');
    expect(results[1].distance).toBe(4);

    expect(results[2].hash).toBe('hash8');
    expect(results[2].distance).toBe(8);

    // dist9 should be excluded
    const hasDist9 = results.some(r => r.hash === 'hash9');
    expect(hasDist9).toBe(false);

    // VIDEO should be excluded
    const hasVideo = results.some(r => r.hash === 'hash0v');
    expect(hasVideo).toBe(false);
  });

  it('gracefully handles missing pHash (generated column is NULL)', async () => {
    await prisma.subject.create({
      data: { hash: 'hash_null', perceptualHash: null, mediaType: 'IMAGE' }
    });

    const results = await repository.nearest('0000000000000000', 'IMAGE', 8);
    expect(results).toHaveLength(0);
  });
});
