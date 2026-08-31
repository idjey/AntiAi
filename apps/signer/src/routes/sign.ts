import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@antiai/database';
import { buildCanonicalPayload } from '@antiai/crypto';
import { AwsKmsClient } from '../kms/aws-kms';
import Redis from 'ioredis';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Setup Redis for rate limiting
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

// Instantiate AwsKmsClient (region uses AWS_REGION or defaults)
const kmsClient = new AwsKmsClient();

// 1. STRICT INPUT VALIDATION
const signRequestSchema = z.object({
  proofId: z.string().uuid()
});

export async function signRoute(fastify: FastifyInstance) {
  fastify.post('/sign', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = signRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parseResult.error });
    }

    const { proofId } = parseResult.data;

    // 2. FETCH SOURCE OF TRUTH (DATABASE)
    const proof = await prisma.proof.findUnique({
      where: { id: proofId },
      include: {
        video: true,
        channel: true,
        perceptualHashes: true,
        signingKey: true
      }
    });

    if (!proof) {
      return reply.status(404).send({ error: 'Proof not found in database' });
    }

    if (!proof.signingKey) {
      return reply.status(500).send({ error: 'SigningKey not associated with proof' });
    }

    const { signingKey } = proof;

    // 3. VELOCITY LIMITS (Redis)
    // Keyed by `kid` to bound every signing path (including platform key)
    const currentMinute = Math.floor(Date.now() / 60000);
    const rateLimitKey = `signer:ratelimit:kid:${signingKey.id}:${currentMinute}`;
    const maxSignsPerMinute = signingKey.rateLimitMax || 500;

    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      // Set expiration to 60 seconds
      await redis.expire(rateLimitKey, 60);
    }

    if (currentCount > maxSignsPerMinute) {
      request.log.warn(`Rate limit exceeded for kid ${signingKey.id}. Count: ${currentCount}`);
      return reply.status(429).send({ error: 'Velocity limit exceeded for this key' });
    }

    // 4. SECURITY BOUNDARY ENFORCEMENT
    if (signingKey.provider === 'local') {
      // The legacy local key stays for verification ONLY.
      // This signer structurally refuses to load local private keys.
      return reply.status(501).send({ error: 'Signer is KMS-only. Local provider is unsupported for signing.' });
    }

    if (signingKey.provider !== 'aws_kms' || !signingKey.providerKeyId) {
      return reply.status(500).send({ error: 'Invalid provider or missing providerKeyId for KMS signing' });
    }

    // 5. RE-DERIVE PAYLOAD
    let phashes: Record<string, string> | undefined = undefined;
    let phashVersion: number | undefined = undefined;
    
    if (proof.perceptualHashes && proof.perceptualHashes.length > 0) {
      phashes = {};
      const rawHashes = await prisma.$queryRaw<Array<{ anchor_fraction: number, phash_bin: string, version: number }>>`
        SELECT anchor_fraction, phash_bits::varchar as phash_bin, version 
        FROM proof_perceptual_hashes 
        WHERE proof_id = ${proof.id}::uuid
      `;
      
      for (const row of rawHashes) {
        const hex = BigInt('0b' + row.phash_bin).toString(16).padStart(16, '0');
        phashes[row.anchor_fraction.toString()] = hex;
        phashVersion = row.version;
      }
    }

    const expiresAtUnix = Math.floor(proof.expiresAt.getTime() / 1000);
    
    const { payload, payloadBytes } = buildCanonicalPayload({
      kid: proof.kid,
      youtubeVideoId: proof.video.platformId,
      youtubeChannelId: proof.channel.platformId,
      expiresAtUnix,
      contentHash: proof.contentHash || undefined,
      perceptualHashes: phashes,
      perceptualHashVersion: phashVersion
    });

    // 6. SIGN VIA KMS
    try {
      const rawSigB64Url = await kmsClient.sign(Buffer.from(payloadBytes), signingKey.providerKeyId, 'Ed25519');

      // Convert URL-safe base64 back to raw buffer for verification
      const rawSigBuffer = Buffer.from(
        rawSigB64Url.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      );

      // Extract DB public key bytes
      const publicKeyBytes = Buffer.from(signingKey.publicKeyB64, 'base64');
      
      // Wrap raw Ed25519 public key in SPKI/DER envelope for Node crypto
      const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
      const fullSpki = Buffer.concat([spkiPrefix, publicKeyBytes]);
      
      const publicKeyObject = crypto.createPublicKey({
        key: fullSpki,
        format: 'der',
        type: 'spki'
      });

      const isValid = crypto.verify(
        null,
        Buffer.from(payloadBytes),
        publicKeyObject,
        rawSigBuffer
      );

      if (!isValid) {
        request.log.error(`CRITICAL: KMS signature failed self-verification for kid ${signingKey.id}!`);
        throw new Error('KMS signature self-verification failed');
      }

      const payload_b64 = Buffer.from(payloadBytes).toString('base64');
      const payloadB64Url = payload_b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

      // 7. UPDATE DB
      await prisma.proof.update({
        where: { id: proofId },
        data: {
          signatureB64: rawSigB64Url,
          payloadB64: payloadB64Url,
          payloadJson: payload as any,
          status: 'active' as any
        }
      });

      return reply.send({ signatureB64: rawSigB64Url });
    } catch (err: any) {
      request.log.error(`KMS Signing failed: ${err.message}`);
      return reply.status(500).send({ error: 'Failed to sign proof' });
    }
  });
}
