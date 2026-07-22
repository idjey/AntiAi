import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import nacl from 'tweetnacl';
import { signAttestation, deriveKeyId } from '@antiai/attestation-core';

describe('Foundation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Route-Liveness', () => {
    test.each([
      ['POST', '/v1/identities/challenge'], ['POST', '/v1/identities/register'],
      ['POST', '/v1/attestations'],         ['POST', '/v1/subjects/resolve'],
    ])('%s %s is not 404', async (method, path) => {
      const req = request(app.getHttpServer());
      const res = await (req as any)[method.toLowerCase()](path).send({});
      expect(res.status).not.toBe(404);
    });
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

    it('POST /v1/attestations - submits attestation', async () => {
      const payload: any = createValidPayload();
      const signed = signAttestation(payload, keyPair.secretKey);
      
      const res = await request(app.getHttpServer())
        .post('/v1/attestations')
        .send({
          payload: signed.payload,
          payloadHash: signed.payloadHash,
          signature: signed.signature
        })
        .expect(201);

      // Verify it was persisted in the real database
      const dbRow = await prisma.attestation.findUnique({
        where: { payloadHash: signed.payloadHash }
      });
      expect(dbRow).toBeDefined();
      expect(dbRow?.signature).toBe(signed.signature);
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
