import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
    
    // Seed key for real database testing
    await prismaService.signingKey.upsert({
      where: { id: 'k_2026_01' },
      update: {},
      create: {
        id: 'k_2026_01',
        alg: 'Ed25519',
        publicKeyB64: 'mock_public_key_b64',
        privateKeyB64: 'mock_private_key_b64',
        isActive: true,
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('antiai-api');
        expect(typeof res.body.timestamp).toBe('string');
      });
  });

  it('/public/keys (GET)', () => {
    return request(app.getHttpServer())
      .get('/public/keys')
      .expect(200)
      .expect((res) => {
        expect(res.body.keys).toBeDefined();
        expect(Array.isArray(res.body.keys)).toBe(true);
        expect(res.body.keys[0].kid).toBe('k_2026_01');
      });
  });
});
