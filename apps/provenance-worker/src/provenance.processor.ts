import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '@antiai/database';
import { fetchPinned } from './media-fetcher';
import { SsrfViolation } from './ssrf-guard';
import { PhashService, hammingDistance, MACHINE_VERIFIABLE } from './phash.service';

const PHASH_MATCH_THRESHOLD = 8;   // Hamming distance; tune with real re-upload corpus

@Processor('provenance-verify')
export class ProvenanceProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private phash: PhashService,
    @InjectQueue('aggregation') private aggregationQ: Queue,
  ) {
    super();
  }

  async process(job: Job<{ attestationId: string }>): Promise<void> {
    const attestation = await this.prisma.attestation.findUniqueOrThrow({
      where: { id: job.data.attestationId },
      include: { subject: true },
    });
    
    const claim = attestation.claimPayload as { sourceUrl?: string };
    
    if (!claim.sourceUrl) {
      return; // Nothing to verify
    }

    if (!MACHINE_VERIFIABLE.has(attestation.subject.mediaType)) {
      // Honest state: recorded, awaiting human corroboration — not fake-verified.
      return; // stays PENDING; aggregation treats it as an ordinary claim
    }

    let verdict: 'MACHINE_VERIFIED' | 'PENDING';
    let matchScore: number | null = null;

    try {
      const media = await fetchPinned(claim.sourceUrl);
      const candidateHash = await this.phash.compute(media, attestation.subject.mediaType);
      const distance = hammingDistance(candidateHash, attestation.subject.perceptualHash!);
      matchScore = 1 - distance / candidateHash.length / 4; // normalized, hex-nibble based
      verdict = distance <= PHASH_MATCH_THRESHOLD ? 'MACHINE_VERIFIED' : 'PENDING';
    } catch (e) {
      if (e instanceof SsrfViolation) {
        // Security telemetry, not a retry: an SSRF attempt is a signal about the attester.
        console.warn('SSRF_ATTEMPT', {
          attestationId: attestation.id, attesterId: attestation.attesterId,
          url: claim.sourceUrl, violation: e.code,
        });
        return; // attestation stays PENDING; do NOT retry
      }
      throw e; // transient fetch failures → BullMQ retry with backoff
    }

    await this.prisma.attestation.update({
      where: { id: attestation.id },
      data: {
        status: verdict,
        claimPayload: { ...claim, matchScore, verifiedAt: new Date().toISOString() },
      },
    });
    
    if (verdict === 'MACHINE_VERIFIED') {
      await this.aggregationQ.add('recompute', { subjectHash: attestation.subject.hash },
        { jobId: `agg:${attestation.subject.hash}` });
    }
  }
}
