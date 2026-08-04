import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { randomUUID, randomBytes } from 'crypto';

describe('POST /v1/subjects/resolve (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('correctly matches a subject using perceptual nearest-neighbor scan', async () => {
    // 1. Setup a subject with a known perceptual hash
    // We will use 'ffffffffffffffff' as the base perceptual hash (64 bits, all 1s).
    const basePhash = 'ffffffffffffffff';
    const exactHash = randomBytes(32).toString('hex'); // 64 char hex

    const subject = await prisma.subject.create({
      data: {
        hash: exactHash,
        perceptualHash: basePhash,
        mediaType: 'IMAGE',
      }
    });

    // 2. We resolve with a slightly different perceptual hash.
    // 'fffffffffffffffe' has a Hamming distance of 1 from 'ffffffffffffffff'.
    const nearDuplicatePhash = 'fffffffffffffffe';

    // The endpoint expects an array of perceptual hashes (fraction and hash)
    const payload = {
      mediaType: 'IMAGE',
      perceptualHashes: [
        { fraction: 1.0, hash: nearDuplicatePhash }
      ]
    };

    // 3. Make the API request
    const response = await request(app.getHttpServer())
      .post('/v1/subjects/resolve')
      .send(payload);

    // 4. Assert the scan successfully found the near-duplicate subject
    expect(response.status).toBe(201); // NestJS default for successful POST
    expect(response.body).toBeDefined();
    
    // It should have returned a 'perceptual' match with the original subject
    expect(response.body.match).toBe('perceptual');
    expect(response.body.subject).toBeDefined();
    expect(response.body.subject.id).toBe(subject.id);
    expect(response.body.distance).toBe(1); // distance is 1
  });
});
