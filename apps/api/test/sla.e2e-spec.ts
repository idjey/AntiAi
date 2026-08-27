import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import request from 'supertest';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import nacl from 'tweetnacl';
import { signAttestation } from '@antiai/attestation-core';
import * as crypto from 'crypto';

describe('SLA Tiered Throttling & Queue Priority (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aggregationQueue: Queue;
  let freeKeyRaw = `free-key-${Date.now()}`;
  let entKeyRaw = `ent-key-${Date.now()}`;
  let entOrgId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    aggregationQueue = app.get<Queue>(getQueueToken('aggregation'));
    
    // Seed Data
    const freeUser = await prisma.user.create({
      data: { email: `free-sla-e2e-${Date.now()}@example.com`, passwordHash: 'dummy' }
    });
    
    await prisma.apiKey.create({
      data: {
        userId: freeUser.id,
        keyHash: crypto.createHash('sha256').update(freeKeyRaw).digest('hex'),
        name: 'Free Key'
      }
    });

    const entUser = await prisma.user.create({
      data: { email: `ent-sla-e2e-${Date.now()}@example.com`, passwordHash: 'dummy' }
    });

    await prisma.apiKey.create({
      data: {
        userId: entUser.id,
        keyHash: crypto.createHash('sha256').update(entKeyRaw).digest('hex'),
        name: 'Ent Key'
      }
    });

    const entOrg = await prisma.organization.create({
      data: { name: 'Ent Org', slug: `ent-org-${Date.now()}` }
    });
    entOrgId = entOrg.id;

    await prisma.organizationSubscription.create({
      data: { 
        organizationId: entOrg.id, 
        tier: 'enterprise', 
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });

    await prisma.teamMember.create({
      data: { organizationId: entOrg.id, userId: entUser.id, role: 'OWNER' }
    });
  });

  afterAll(async () => {
    if (aggregationQueue) await aggregationQueue.close();
    if (prisma) await prisma.$disconnect();
    if (app) await app.close();
  });

  describe('Rate Limiting', () => {
    it('should throttle free tier after 10 requests', async () => {
      // 10 successful requests
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .get('/health')
          .set('x-api-key', freeKeyRaw)
          .expect(200);
      }
      
      // 11th should be 429
      await request(app.getHttpServer())
        .get('/health')
        .set('x-api-key', freeKeyRaw)
        .expect(429);
    });

    it('should NOT throttle enterprise tier after 10 requests', async () => {
      // 15 successful requests
      for (let i = 0; i < 15; i++) {
        await request(app.getHttpServer())
          .get(`/health?organizationId=${entOrgId}`)
          .set('x-api-key', entKeyRaw)
          .expect(200);
      }
    });
  });

  describe('BullMQ Queue Priority', () => {
    let keyPair: nacl.SignKeyPair;
    let keyId: string;

    beforeAll(async () => {
      keyPair = nacl.sign.keyPair();
      const publicKeyB64 = Buffer.from(keyPair.publicKey).toString('base64');
      const challengeRes = await request(app.getHttpServer())
        .post('/v1/identities/challenge')
        .send({ publicKey: publicKeyB64 });
      const nonce = challengeRes.body.nonce;
      const signature = nacl.sign.detached(Buffer.from(nonce, 'utf8'), keyPair.secretKey);
      
      const regRes = await request(app.getHttpServer())
        .post('/v1/identities/register')
        .send({
          publicKey: publicKeyB64,
          challengeSignature: Buffer.from(signature).toString('base64'),
          platform: 'WEB'
        });
      keyId = regRes.body.keyId;
    });

    it('should assign priority 5 to free tier jobs', async () => {
      const addSpy = jest.spyOn(aggregationQueue, 'add').mockResolvedValue(undefined as any);
      
      const payload: any = {
        version: '1.0',
        subject: { hash: `hash-free-${Date.now()}`, perceptualHash: 'aaaaaaaaaaaaaaaa', mediaType: 'image', sizeBytes: 1024 },
        claim: { type: 'provenance_found', payload: { sourceUrl: 'https://example.com' } },
        attester: { keyId, identityClass: 'pseudonymous' },
        context: { domain: 'public', timestamp: new Date().toISOString(), nonce: '1' }
      };

      const signed = signAttestation(payload, keyPair.secretKey);
      
      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .set('x-api-key', freeKeyRaw)
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        });
      
      if (res.status !== 201) {
        console.error('Free Tier failed with status', res.status, res.body);
      }
      expect(res.status).toBe(201);
      
      expect(addSpy).toHaveBeenCalledWith(
        'recompute',
        expect.anything(),
        expect.objectContaining({ priority: 5 })
      );
      
      addSpy.mockRestore();
    });

    it('should assign priority 1 to enterprise tier jobs', async () => {
      const addSpy = jest.spyOn(aggregationQueue, 'add').mockResolvedValue(undefined as any);
      
      const payload: any = {
        version: '1.0',
        subject: { hash: `hash-ent-${Date.now()}`, perceptualHash: 'aaaaaaaaaaaaaaaa', mediaType: 'image', sizeBytes: 1024 },
        claim: { type: 'provenance_found', payload: { sourceUrl: 'https://example.com' } },
        attester: { keyId, identityClass: 'pseudonymous' },
        context: { domain: 'public', timestamp: new Date().toISOString(), nonce: '1' }
      };

      const signed = signAttestation(payload, keyPair.secretKey);

      const res = await request(app.getHttpServer())
        .post(`/v1/attestations?organizationId=${entOrgId}`)
        .set('x-api-key', entKeyRaw)
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        });
        
      if (res.status !== 201) {
        console.error('Ent Tier failed with status', res.status, res.body);
      }
      expect(res.status).toBe(201);
      
      expect(addSpy).toHaveBeenCalledWith(
        'recompute',
        expect.anything(),
        expect.objectContaining({ priority: 1 })
      );
      
      addSpy.mockRestore();
    });
  });
});
