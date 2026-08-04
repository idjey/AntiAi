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
    // We will use a random perceptual hash for the base to avoid dirty database collisions
    const basePhash = randomBytes(8).toString('hex'); // 16 chars (64 bits)
    const exactHash = randomBytes(32).toString('hex'); // 64 char hex

    const subject = await prisma.subject.create({
      data: {
        hash: exactHash,
        perceptualHash: basePhash,
        mediaType: 'IMAGE',
      }
    });

    // Seed a distant subject (invert all bits -> Hamming distance 64)
    const distantPhash = basePhash.split('').map(c => (15 - parseInt(c, 16)).toString(16)).join('');
    const distantSubject = await prisma.subject.create({
      data: {
        hash: randomBytes(32).toString('hex'),
        perceptualHash: distantPhash,
        mediaType: 'IMAGE',
      }
    });

    // Seed a malformed subject (survives the scan due to CASE guard)
    const malformedPhash = 'malformed-invalid-hash';
    const malformedSubject = await prisma.subject.create({
      data: {
        hash: randomBytes(32).toString('hex'),
        perceptualHash: malformedPhash,
        mediaType: 'IMAGE',
      }
    });

    // 2. We resolve with a slightly different perceptual hash.
    // Flip the last bit to get a Hamming distance of 1.
    const lastCharHex = parseInt(basePhash[15], 16) ^ 1;
    const nearDuplicatePhash = basePhash.slice(0, 15) + lastCharHex.toString(16);

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
    expect(response.body.subject.id).toBe(subject.id); // Matches the near-duplicate
    expect(response.body.subject.id).not.toBe(distantSubject.id); // Excludes the distant one
    expect(response.body.subject.id).not.toBe(malformedSubject.id); // Excludes the malformed one
    expect(response.body.distance).toBe(1); // distance is 1
  });
});
