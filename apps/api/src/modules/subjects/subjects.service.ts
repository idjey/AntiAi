import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectRedis } from '../redis/redis.module';
import { ResolveDto } from './dto/resolve.dto';
import { SubjectPhashRepository } from './repositories/subject-phash.repository';
import { CounterService } from './services/counter.service';
import { CryptoLookupService } from './services/crypto-lookup.service';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRedis() private redis: Redis,
    private prisma: PrismaService,
    private phashRepo: SubjectPhashRepository,
    private counters: CounterService,
    private crypto: CryptoLookupService,
  ) {}

  async resolve(dto: ResolveDto) {
    // Generate a stable cache key
    let cacheKey = `resolve:${dto.hash ?? 'p:none'}:${dto.mediaType.toLowerCase()}`;
    if (dto.perceptualHashes && dto.perceptualHashes.length > 0) {
      const pKey = dto.perceptualHashes.map(h => `${h.fraction}:${h.hash}`).join(',');
      cacheKey = `resolve:${dto.hash ?? 'p:' + pKey}:${dto.mediaType.toLowerCase()}`;
    }

    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.subject?.id) this.counters.bumpCheck(parsed.subject.id);
      return parsed;
    }

    let cryptoVerdict = null;
    if (dto.hash) {
      cryptoVerdict = await this.crypto.lookupByHash(dto.hash);
    }
    if (!cryptoVerdict && dto.perceptualHashes && dto.perceptualHashes.length > 0) {
      cryptoVerdict = await this.crypto.lookupByPerceptualHash(dto.perceptualHashes);
    }

    // 2. Exact byte-hash lookup (unique index — sub-ms)
    if (dto.hash) {
      const subject = await this.prisma.subject.findUnique({
        where: { hash: dto.hash },
      });
      if (subject) return this.respond(subject, 'exact', cacheKey, cryptoVerdict);
    }

    // 3. Perceptual nearest-neighbor (Option B scan)
    // For Option B, we just take the first perceptual hash for the legacy subjects table nearest-neighbor if needed.
    // The subject table hasn't been migrated to fractional matching yet, so we use the first hash.
    if (dto.perceptualHashes && dto.perceptualHashes.length > 0) {
      const firstHash = dto.perceptualHashes[0].hash;
      const candidates = await this.phashRepo.nearest(firstHash, dto.mediaType, 8);
      if (candidates.length > 0) {
        return this.respond(candidates[0], 'perceptual', cacheKey, cryptoVerdict, {
          distance: candidates[0].distance,
          ambiguous: candidates.length > 1 && candidates[1].distance <= 8,
        });
      }
    }

    // 4. Miss — create subject ONLY when we have the exact hash
    if (dto.hash) {
      try {
        const subject = await this.prisma.subject.create({
          data: {
            hash: dto.hash,
            perceptualHash: dto.perceptualHashes ? dto.perceptualHashes[0].hash : null,
            mediaType: dto.mediaType,
          },
        });
        return this.respond(subject, 'none', cacheKey, cryptoVerdict);
      } catch (e: any) {
        if (e && e.code === 'P2002') {
          // Race condition on creation
          const existing = await this.prisma.subject.findUnique({ where: { hash: dto.hash } });
          if (existing) return this.respond(existing, 'exact', cacheKey, cryptoVerdict);
        }
        throw e;
      }
    }

    // pHash-only miss
    const noneResponse = { match: 'none', subject: null, cryptoVerdict };
    await this.redis.set(cacheKey, JSON.stringify(noneResponse), 'EX', 10);
    return noneResponse;
  }

  private async respond(
    subject: any, 
    match: string, 
    cacheKey: string, 
    cryptoVerdict: any, 
    extra: any = {}
  ) {
    const response = {
      match,
      subject,
      ...extra,
      cryptoVerdict,
    };
    await this.redis.set(cacheKey, JSON.stringify(response), 'EX', 10);
    this.counters.bumpCheck(subject.id);
    return response;
  }

  async getDetail(hash: string) {
    const cacheKey = `subject:${hash}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const subject = await this.prisma.subject.findUnique({
      where: { hash },
    });

    if (!subject) return null;

    const cryptoVerdict = await this.crypto.lookupByHash(hash);
    const response = { subject, cryptoVerdict, verdictSummary: subject.verdictSummary || null };
    
    await this.redis.set(cacheKey, JSON.stringify(response), 'EX', 10);
    return response;
  }

  async getTimeline(hash: string, cursor?: string, limit = 25) {
    const subject = await this.prisma.subject.findUnique({
      where: { hash },
      select: { id: true },
    });
    if (!subject) return { items: [] };

    let whereClause: any = { subjectId: subject.id, domain: 'PUBLIC' };

    if (cursor) {
      const [receivedAtIso, id] = Buffer.from(cursor, 'base64').toString('utf-8').split('|');
      if (receivedAtIso && id) {
        whereClause = {
          ...whereClause,
          OR: [
            { receivedAt: { gt: new Date(receivedAtIso) } },
            { receivedAt: new Date(receivedAtIso), id: { gt: id } }
          ]
        };
      }
    }

    const items = await this.prisma.attestation.findMany({
      where: whereClause,
      take: limit,
      orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        payloadHash: true,
        version: true,
        claimType: true,
        claimPayload: true,
        receivedAt: true,
        signature: true,
        nonce: true,
        payloadB64: true,
        attester: {
          select: {
            keyId: true,
            publicKey: true,
            status: true,
          }
        }
      }
    });

    let nextCursor = null;
    if (items.length === limit) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(`${lastItem.receivedAt.toISOString()}|${lastItem.id}`).toString('base64');
    }

    return { items, nextCursor };
  }

  async getCryptoProof(hash: string) {
    let proof = await this.prisma.proof.findFirst({
      where: { contentHash: hash },
      orderBy: { issuedAt: 'desc' },
      include: {
        signingKey: {
          select: { publicKeyB64: true }
        }
      }
    });

    if (!proof) {
      // Fallback: check if the subject has a perceptual hash and find a matching proof
      const subject = await this.prisma.subject.findUnique({
        where: { hash },
        select: { perceptualHash: true, mediaType: true }
      });

      if (subject && subject.perceptualHash) {
        const candidates = await this.phashRepo.nearest(subject.perceptualHash, subject.mediaType, 8);
        if (candidates.length > 0) {
          const originalSubject = await this.prisma.subject.findUnique({
            where: { hash: candidates[0].hash }
          });
          if (originalSubject) {
            proof = await this.prisma.proof.findFirst({
              where: { contentHash: originalSubject.hash },
              orderBy: { issuedAt: 'desc' },
              include: {
                signingKey: {
                  select: { publicKeyB64: true }
                }
              }
            });
          }
        }
      }
    }

    if (!proof) {
      return null;
    }

    return {
      payloadB64: proof.payloadB64,
      signatureB64: proof.signatureB64,
      contentHash: proof.contentHash,
      kid: proof.kid,
      publicKeyB64: proof.signingKey.publicKeyB64,
      lifecycle: {
        status: proof.status,
        issuedAt: proof.issuedAt,
        expiresAt: proof.expiresAt,
        revokedAt: proof.revokedAt,
        supersededAt: proof.supersededAt,
      }
    };
  }
}
