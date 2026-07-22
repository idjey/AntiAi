import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import sharp from 'sharp';
import { PhashService } from '../../provenance-worker/src/phash.service';

describe('POST /v1/subjects/phash (e2e)', () => {
  let app: INestApplication;
  let phashService: PhashService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [PhashService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    phashService = moduleFixture.get<PhashService>(PhashService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects non-image payloads (MIME sniffing)', async () => {
    const textBuffer = Buffer.from('Not an image file');
    const response = await request(app.getHttpServer())
      .post('/v1/subjects/phash')
      .attach('file', textBuffer, 'test.png'); // Spoof extension
      
    expect(response.status).toBe(415);
    expect(response.body.message).toMatch(/Only images are supported/i);
  });

  it('generates identical pHash as the provenance-worker for the same image', async () => {
    // Generate a valid PNG image buffer
    const imageBuffer = await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 } // Red image
      }
    }).png().toBuffer();

    // 1. Hit the API endpoint
    const response = await request(app.getHttpServer())
      .post('/v1/subjects/phash')
      .attach('file', imageBuffer, 'red.png');
      
    expect(response.status).toBe(201); // NestJS POST default is 201
    expect(response.body).toHaveProperty('perceptualHash');
    const apiHash = response.body.perceptualHash;

    // 2. Compute via the worker's service class
    const workerHash = await phashService.compute(imageBuffer, 'IMAGE');

    // 3. Assert perfect parity
    expect(apiHash).toEqual(workerHash);
  });

  it('enforces rate limiting (20/min)', async () => {
    // Generate a small valid image
    const imageBuffer = await sharp({
      create: { width: 10, height: 10, channels: 3, background: 'blue' }
    }).png().toBuffer();

    let lastStatus = 201;
    for (let i = 0; i < 25; i++) {
      const res = await request(app.getHttpServer())
        .post('/v1/subjects/phash')
        .attach('file', imageBuffer, 'blue.png');
      lastStatus = res.status;
    }
    
    // Should be rate limited (429) after 20 hits
    expect(lastStatus).toBe(429);
  });
});
