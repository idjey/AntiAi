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
    })
      .overrideProvider(PrismaService)
      .useValue({
        // Mock prisma methods we need
        signingKey: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'k_2026_01',
              alg: 'Ed25519',
              publicKeyB64: 'mock_public_key_b64',
              isActive: true,
              createdAt: new Date(),
            },
          ]),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({
        status: 'ok',
        version: '0.1.0',
      });
  });

  it('/public/keys (GET)', () => {
    return request(app.getHttpServer())
      .get('/public/keys')
      .expect(200)
      .expect((res) => {
        expect(res.body.keys).toBeDefined();
        expect(Array.isArray(res.body.keys)).toBe(true);
        expect(res.body.keys[0].id).toBe('k_2026_01');
      });
  });
});
