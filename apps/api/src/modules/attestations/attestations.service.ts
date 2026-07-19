import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaType, ClaimType } from '@prisma/client';
import { EnvelopeVerifierService } from './services/envelope-verifier.service';
import { IdentityCacheService } from './services/identity-cache.service';
import { RateLimitService } from './services/rate-limit.service';
import { IdempotencyService } from './services/idempotency.service';
import { SubmitAttestationDto, PUBLIC_CLAIM_TYPES } from './dto/submit-attestation.dto';
import { AttestationError } from './errors/attestation-errors';

export interface SubmitResult {
  id: string;
  duplicate: boolean;
}

const MAX_SKEW_MS = 10 * 60 * 1000;

function assertTimestampSane(clientTimestampIso: string, now = Date.now()): void {
  const t = Date.parse(clientTimestampIso);
  if (Number.isNaN(t)) throw new AttestationError('TIMESTAMP_SKEW', 422, { reason: 'unparseable' });
  const skewMs = Math.abs(now - t);
  if (skewMs > MAX_SKEW_MS) {
    throw new AttestationError('TIMESTAMP_SKEW', 422, {
      skewMs, maxSkewMs: MAX_SKEW_MS,
      serverTime: new Date(now).toISOString(),   // lets well-behaved clients self-correct clock drift
    });
  }
}

function isPrismaUniqueViolation(e: any): boolean {
  return e && e.code === 'P2002';
}

function toMediaTypeEnum(mediaType: string): MediaType {
  const map: Record<string, MediaType> = {
    'video': 'VIDEO',
    'image': 'IMAGE',
    'audio': 'AUDIO',
    'pdf': 'PDF',
    'other': 'OTHER'
  };
  return map[mediaType] || 'OTHER';
}

function toClaimTypeEnum(claimType: string): ClaimType {
  return claimType.toUpperCase() as ClaimType;
}

import { CanariesService } from '../canaries/canaries.service';

@Injectable()
export class AttestationsService {
  constructor(
    private verifier: EnvelopeVerifierService,
    private identities: IdentityCacheService,
    private rateLimit: RateLimitService,
    private idempotency: IdempotencyService,
    private prisma: PrismaService,
    private canaries: CanariesService,
    @InjectQueue('aggregation') private aggregationQ: Queue,
    @InjectQueue('provenance-verify') private provenanceQ: Queue,
  ) {}

  async submit(dto: SubmitAttestationDto): Promise<SubmitResult> {
    // Step 1 happened in the pipe. Phase 1 domain gate:
    if (dto.payload.context.domain !== 'public'
        || !PUBLIC_CLAIM_TYPES.has(dto.payload.claim.type)) {
      throw new AttestationError('DOMAIN_FORBIDDEN', 403);
    }

    // Step 2
    const bytes = this.verifier.assertCanonicalHash(dto);

    // Step 3
    const identity = await this.identities.resolve(dto.payload.attester.keyId);
    this.identities.assertUsable(identity);

    // Step 4
    this.verifier.assertSignature(bytes, dto.signature, identity.publicKey);

    // Step 5
    assertTimestampSane(dto.payload.context.timestamp);

    // Step 6
    await this.rateLimit.consume(identity.id, identity.status as 'PROBATION' | 'ACTIVE');

    // Step 7
    const existingId = await this.idempotency.check(dto.payloadHash);
    if (existingId) return { id: existingId, duplicate: true };

    // Step 8 — persist atomically
    const now = new Date(Date.now());
    let attestation;
    try {
      attestation = await this.prisma.$transaction(async (tx) => {
        const subject = await tx.subject.upsert({
          where: { hash: dto.payload.subject.hash },
          create: {
            hash: dto.payload.subject.hash,
            perceptualHash: dto.payload.subject.perceptualHash,
            mediaType: toMediaTypeEnum(dto.payload.subject.mediaType),
            attestationCount: 1,
          },
          update: { attestationCount: { increment: 1 } },
        });
        return tx.attestation.create({
          data: {
            payloadHash: dto.payloadHash,
            version: dto.payload.version,
            subjectId: subject.id,
            claimType: toClaimTypeEnum(dto.payload.claim.type),
            claimPayload: (dto.payload.claim.payload || {}) as any,
            attesterId: identity.id,
            domain: 'PUBLIC',
            clientTimestamp: new Date(dto.payload.context.timestamp),
            nonce: dto.payload.context.nonce,
            signature: dto.signature,
            receivedAt: now,
          },
        });
      });
    } catch (e) {
      if (isPrismaUniqueViolation(e)) {                    // P2002 — concurrent duplicate
        const existing = await this.prisma.attestation.findUnique({
          where: { payloadHash: dto.payloadHash }, select: { id: true },
        });
        if (existing) return { id: existing.id, duplicate: true };
      }
      throw e;
    }
    await this.idempotency.record(dto.payloadHash, attestation.id);

    // Step 9 — enqueue AFTER commit, never inside the transaction
    await this.aggregationQ.add('recompute', { subjectHash: dto.payload.subject.hash },
      { jobId: `agg-${dto.payload.subject.hash}`, removeOnComplete: true });
    if (attestation.claimType === 'PROVENANCE_FOUND') {
      await this.provenanceQ.add('verify', { attestationId: attestation.id },
        { jobId: `prov-${attestation.id}`, attempts: 3, backoff: { type: 'exponential', delay: 30_000 } });
    }

    // Step 10: Process Canaries
    await this.canaries.processCanaryIfMatch(dto.payload.subject.hash, attestation.id);

    return { id: attestation.id, duplicate: false };
  }
  
  async findByPayloadHash(payloadHash: string) {
    return this.prisma.attestation.findUnique({
      where: { payloadHash },
      include: { subject: true }
    });
  }
}
