import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@antiai/database';
import { buildCanonicalPayload } from '@antiai/crypto';
import { LocalKmsClient } from '../kms/local-kms';
import { IKmsClient } from '../kms/kms-client';

const prisma = new PrismaClient();

// In production, this would be injected or swapped based on NODE_ENV.
let kmsClient: IKmsClient;
try {
  kmsClient = new LocalKmsClient();
} catch (e) {
  console.error("Failed to initialize KMS Client:", e);
  process.exit(1);
}

// 1. STRICT INPUT VALIDATION
// The request supplies ONLY the identifier. No payload hints.
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
    // Fetch the proof and the strictly necessary related entities to re-derive the payload.
    const proof = await prisma.proof.findUnique({
      where: { id: proofId },
      include: {
        video: true,
        channel: true,
        perceptualHashes: true
      }
    });

    if (!proof) {
      return reply.status(404).send({ error: 'Proof not found in database' });
    }

    // A real implementation might use a 'pending' state, but for Increment 1 
    // we assume the API creates it without a signature, and we just sign it if it lacks one,
    // or we just unconditionally re-sign it (idempotency).
    
    let phashes: Record<string, string> | undefined = undefined;
    let phashVersion: number | undefined = undefined;
    
    if (proof.perceptualHashes && proof.perceptualHashes.length > 0) {
      phashes = {};
      
      // Use raw SQL to read the bit(64) column properly. Cast to varchar to get a string of 1s and 0s.
      const rawHashes = await prisma.$queryRaw<Array<{ anchor_fraction: number, phash_bin: string, version: number }>>`
        SELECT anchor_fraction, phash_bits::varchar as phash_bin, version 
        FROM proof_perceptual_hashes 
        WHERE proof_id = ${proof.id}::uuid
      `;
      
      for (const row of rawHashes) {
        // Convert binary string back to hex. Pad with 0s to ensure it's 16 chars (64 bits).
        const hex = BigInt('0b' + row.phash_bin).toString(16).padStart(16, '0');
        phashes[row.anchor_fraction.toString()] = hex;
        phashVersion = row.version; // Assumes all have the same version
      }
    }

    // 3. RE-DERIVE PAYLOAD
    // We derive everything strictly from the DB records. No request input is used here.
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

    // 4. SIGN VIA KMS STUB
    try {
      // Stub uses 'Ed25519' exclusively.
      const signatureB64 = await kmsClient.sign(Buffer.from(payloadBytes), proof.kid, 'Ed25519');

      // The signature logic in @noble/ed25519 signs the raw payloadBytes, not the sha512 hash in some modes.
      // Wait, let's check what `@antiai/crypto` does: `ed25519.sign(payloadBytes, priv32)` 
      // It signs the raw bytes! Not the hash.
      // So KMS client must sign payloadBytes directly if it's acting as a drop-in. 
      // For a real AWS KMS Ed25519, the payload size is limited to 4096 bytes unless hashed. 
      // Our payload is well under 4096 bytes. We will pass payloadBytes to the KMS stub.
      const rawSigB64 = await kmsClient.sign(Buffer.from(payloadBytes), proof.kid, 'Ed25519');

      const payload_b64 = Buffer.from(payloadBytes).toString('base64');
      const payloadB64Url = payload_b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

      // 5. UPDATE DB
      await prisma.proof.update({
        where: { id: proofId },
        data: {
          signatureB64: rawSigB64,
          payloadB64: payloadB64Url,
          payloadJson: payload as any,
          status: 'active' as any
        }
      });

      return reply.send({ signatureB64: rawSigB64 });
    } catch (err: any) {
      request.log.error(`KMS Signing failed: ${err.message}`);
      return reply.status(500).send({ error: 'Failed to sign proof' });
    }
  });
}
