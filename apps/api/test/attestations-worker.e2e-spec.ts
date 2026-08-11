import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppModule as WorkerAppModule } from '../../provenance-worker/src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import nacl from 'tweetnacl';
import { signAttestation, deriveKeyId } from '@antiai/attestation-core';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { DNS_LOOKUP } from '../../provenance-worker/src/provenance.processor';
import { lookup } from 'node:dns/promises';
import * as https from 'https';
import { PhashService } from '../../provenance-worker/src/phash.service';
const mkcert = require('mkcert');

jest.mock('ipaddr.js', () => {
  const original = jest.requireActual('ipaddr.js');
  return {
    ...original,
    parse: (address: string) => {
      const ip = original.parse(address);
      if (address === '127.0.0.1') {
        ip.range = () => 'unicast';
      }
      return ip;
    }
  };
});

describe('Attestations -> Worker (e2e)', () => {
  let app: INestApplication;
  let workerApp: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let serverPort: number;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';

    const ca = await mkcert.createCA({
      organization: 'Test CA',
      countryCode: 'US',
      state: 'CA',
      locality: 'SF',
      validity: 365
    });

    const cert = await mkcert.createCert({
      ca: { key: ca.key, cert: ca.cert },
      domains: ['127.0.0.1', 'youtube.com'],
      validity: 365
    });

    (global as any).TEST_CA_CERT = ca.cert;

    const gifBytes = Buffer.from('R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=', 'base64');
    server = https.createServer({ key: cert.key, cert: cert.cert }, (req, res) => {
      res.writeHead(200, { 'Content-Type': 'image/gif' });
      res.end(gifBytes);
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(8443, '127.0.0.1', () => {
        serverPort = 8443;
        resolve();
      });
      server.on('error', reject);
    });

    // 1. Boot API App
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    
    prisma = app.get(PrismaService);

    // 2. Boot Worker App (in the same process so it connects to Redis and dequeues)
    const mockAggregationQueue = {
      add: jest.fn(),
    };

    const workerModuleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkerAppModule],
    })
    .overrideProvider(getQueueToken('aggregation'))
    .useValue(mockAggregationQueue)
    .overrideProvider(DNS_LOOKUP)
    .useValue(async (hostname: string, options: any) => {
      if (hostname === 'youtube.com') {
        return [{ address: '127.0.0.1', family: 4 }];
      }
      return lookup(hostname, options);
    })
    .compile();

    workerApp = workerModuleFixture.createNestApplication();
    await workerApp.init();
  });

  afterAll(async () => {
    if (server) server.close();
    await app.close();
    await workerApp.close();
  });

  describe('Identity Module', () => {
    it('POST /v1/identities/challenge - rejects invalid structural key', async () => {
      await request(app.getHttpServer())
        .post('/v1/identities/challenge')
        .send({ publicKey: 'invalid-base64-key!!' })
        .expect(400);
    });

    it('POST /v1/identities/challenge - returns nonce', async () => {
      const kp = nacl.sign.keyPair();
      const pubB64 = Buffer.from(kp.publicKey).toString('base64');
      const res = await request(app.getHttpServer())
        .post('/v1/identities/challenge')
        .send({ publicKey: pubB64 })
        .expect(201);
        
      expect(res.body.nonce).toBeDefined();
      expect(res.body.expiresAt).toBeDefined();
    });

    it('POST /v1/identities/register - rejects bad signature', async () => {
      const kp = nacl.sign.keyPair();
      const pubB64 = Buffer.from(kp.publicKey).toString('base64');
      await request(app.getHttpServer())
        .post('/v1/identities/challenge')
        .send({ publicKey: pubB64 });
      
      await request(app.getHttpServer())
        .post('/v1/identities/register')
        .send({
          publicKey: pubB64,
          challengeSignature: Buffer.from('badsignature' + 'a'.repeat(52)).toString('base64'),
          platform: 'WEB'
        })
        .expect(401);
    });

    it('POST /v1/identities/register - registers identity with valid signature', async () => {
      const kp = nacl.sign.keyPair();
      const pubB64 = Buffer.from(kp.publicKey).toString('base64');
      const challengeRes = await request(app.getHttpServer())
        .post('/v1/identities/challenge')
        .send({ publicKey: pubB64 });
      
      const nonce = challengeRes.body.nonce;
      const signature = nacl.sign.detached(Buffer.from(nonce, 'utf8'), kp.secretKey);

      const res = await request(app.getHttpServer())
        .post('/v1/identities/register')
        .send({
          publicKey: pubB64,
          challengeSignature: Buffer.from(signature).toString('base64'),
          platform: 'WEB'
        })
        .expect(201);

      expect(res.body.keyId).toBeDefined();
      expect(res.body.status).toBe('PROBATION');
    });

    it('POST /v1/identities/register - fails on replay (single-use challenge)', async () => {
      const kp = nacl.sign.keyPair();
      const pubB64 = Buffer.from(kp.publicKey).toString('base64');
      const challengeRes = await request(app.getHttpServer())
        .post('/v1/identities/challenge')
        .send({ publicKey: pubB64 });
      
      const nonce = challengeRes.body.nonce;
      const signature = nacl.sign.detached(Buffer.from(nonce, 'utf8'), kp.secretKey);
      const signatureB64 = Buffer.from(signature).toString('base64');

      // first should succeed
      await request(app.getHttpServer())
        .post('/v1/identities/register')
        .send({ publicKey: pubB64, challengeSignature: signatureB64, platform: 'WEB' })
        .expect(201);

      // replay should fail with 400 (challenge expired/invalid since it was consumed)
      await request(app.getHttpServer())
        .post('/v1/identities/register')
        .send({ publicKey: pubB64, challengeSignature: signatureB64, platform: 'WEB' })
        .expect(400);
    });

    it('GET /v1/identities/:keyId - returns identity without reputation', async () => {
      const kp = nacl.sign.keyPair();
      const pubB64 = Buffer.from(kp.publicKey).toString('base64');
      const challengeRes = await request(app.getHttpServer())
        .post('/v1/identities/challenge')
        .send({ publicKey: pubB64 });
      
      const nonce = challengeRes.body.nonce;
      const signature = nacl.sign.detached(Buffer.from(nonce, 'utf8'), kp.secretKey);
      
      const regRes = await request(app.getHttpServer())
        .post('/v1/identities/register')
        .send({
          publicKey: pubB64,
          challengeSignature: Buffer.from(signature).toString('base64'),
          platform: 'WEB'
        });

      const keyId = regRes.body.keyId;

      const res = await request(app.getHttpServer())
        .get(`/v1/identities/${keyId}`)
        .expect(200);

      expect(res.body.keyId).toBe(keyId);
      expect(res.body.publicKey).toBeUndefined();
      expect(res.body.reputation).toBeUndefined();
    });

    it('GET /v1/identities/:keyId - returns 404 for non-existent', async () => {
      await request(app.getHttpServer())
        .get('/v1/identities/missing-key-id')
        .expect(404);
    });
  });

  describe('Attestations Module', () => {
    const keyPair = nacl.sign.keyPair();
    const publicKeyB64 = Buffer.from(keyPair.publicKey).toString('base64');
    let keyId: string;

    beforeAll(async () => {
      // Register key
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

    const createValidPayload = () => ({
      version: '1.0',
      subject: {
        hash: 'hash0',
        perceptualHash: 'aaaaaaaaaaaaaaaa',
        mediaType: 'image' as const,
        sizeBytes: 1024,
      },
      claim: {
        type: 'provenance_found' as const,
        payload: { sourceUrl: 'https://example.com/image.jpg' } as Record<string, unknown>
      },
      attester: {
        keyId,
        identityClass: 'pseudonymous' as const
      },
      context: {
        domain: 'public' as const,
        timestamp: new Date().toISOString(),
        nonce: 'mock-nonce'
      }
    });

    it('POST /v1/attestations - queue handoff to worker: MACHINE_VERIFIED (Happy Path)', async () => {
      // 1. Get real hash of our dummy GIF
      const phashService = workerApp.get(PhashService);
      const gifBytes = Buffer.from('R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=', 'base64');
      const pHash = await phashService.compute(gifBytes, 'IMAGE');

      const payload: any = createValidPayload();
      payload.subject.perceptualHash = pHash;
      payload.claim.payload.sourceUrl = `https://youtube.com:${serverPort}/test-video`;
      const signed = signAttestation(payload, keyPair.secretKey);
      
      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(201);

      // Wait for worker to dequeue and process it (timeout 5s)
      let dbRow;
      for (let i = 0; i < 150; i++) {
        dbRow = await prisma.attestation.findUnique({
          where: { payloadHash: signed.payloadHash }
        });
        if (dbRow?.status === 'MACHINE_VERIFIED') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(dbRow).toBeDefined();
      expect(dbRow?.status).toBe('MACHINE_VERIFIED');
      expect((dbRow?.claimPayload as any).matchScore).toBeDefined();
    });

    it('POST /v1/attestations - queue handoff to worker: SSRF Negative Path (Remains PENDING)', async () => {
      const payload: any = createValidPayload();
      // Use a new nonce and subject to avoid unique constraint violations
      payload.context.nonce = 'mock-nonce-2';
      payload.subject.hash = 'hash1';
      // example.com is not allowed, triggers SSRF guard
      payload.claim.payload.sourceUrl = `https://example.com/image.jpg`;
      const signed = signAttestation(payload, keyPair.secretKey);
      
      await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(201);

      // Wait for a bit so the worker picks it up and fails
      await new Promise(resolve => setTimeout(resolve, 1000));

      const dbRow = await prisma.attestation.findUnique({
        where: { payloadHash: signed.payloadHash }
      });

      expect(dbRow).toBeDefined();
      expect(dbRow?.status).toBe('PENDING'); // Security guard catches it; worker does NOT retry or throw
      expect((dbRow?.claimPayload as any).matchScore).toBeUndefined();
    });

    it('POST /v1/attestations - unregistered keyid returns 403', async () => {
      const payload: any = createValidPayload();
      payload.attester.keyId = 'mock-unregistered';
      const signed = signAttestation(payload, nacl.sign.keyPair().secretKey);

      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(403);
      expect(res.body.code).toBe('ATT_UNKNOWN_KEY');
    });

    it('POST /v1/attestations - mutated signature returns 401/403', async () => {
      const payload: any = createValidPayload();
      const signed = signAttestation(payload, keyPair.secretKey);
      
      const payload2: any = createValidPayload();
      payload2.subject.sizeBytes = 8888;
      const signed2 = signAttestation(payload2, keyPair.secretKey);

      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed2.signature // Valid signature, but for a different payload
        })
        .expect(401);
      expect(res.body.code).toBe('ATT_BAD_SIGNATURE');
    });

    it('POST /v1/attestations - mutated payload returns 400', async () => {
      const payload: any = createValidPayload();
      const signed = signAttestation(payload, keyPair.secretKey);
      
      signed.payload.subject.sizeBytes = 9999;

      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(400);
      expect(res.body.code).toBe('ATT_HASH_MISMATCH');
    });

    it('POST /v1/attestations - timestamp skew returns 422', async () => {
      const payload: any = createValidPayload();
      payload.context.timestamp = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const signed = signAttestation(payload, keyPair.secretKey);

      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(422);
      expect(res.body.code).toBe('ATT_TIMESTAMP_SKEW');
    });

    it('POST /v1/attestations - duplicate envelope flags duplicate', async () => {
      // Need fresh key pair to not hit rate limits on identity
      const kp = nacl.sign.keyPair();
      const pubB64 = Buffer.from(kp.publicKey).toString('base64');
      const challengeRes = await request(app.getHttpServer())
        .post('/v1/identities/challenge')
        .send({ publicKey: pubB64 });
      
      const sig = nacl.sign.detached(Buffer.from(challengeRes.body.nonce, 'utf8'), kp.secretKey);
      
      const regRes = await request(app.getHttpServer())
        .post('/v1/identities/register')
        .send({
          publicKey: pubB64,
          challengeSignature: Buffer.from(sig).toString('base64'),
          platform: 'WEB'
        });
      
      const newKeyId = regRes.body.keyId;
      
      const payload: any = createValidPayload();
      payload.attester.keyId = newKeyId;
      payload.context.nonce = 'dup-nonce';
      const signed = signAttestation(payload, kp.secretKey);

      await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(201);
        
      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(200);
        
      expect(res.body.duplicate).toBe(true);
    });

    it('POST /v1/attestations - custody_sealed claim returns 403', async () => {
      const payload: any = createValidPayload();
      payload.claim.type = 'custody_sealed';
      payload.claim.payload = {};
      const signed = signAttestation(payload, keyPair.secretKey);

      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(403);
      expect(res.body.code).toBe('ATT_DOMAIN_FORBIDDEN');
    });
  });
});
