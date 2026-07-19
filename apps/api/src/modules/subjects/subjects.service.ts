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
    const cacheKey = `resolve:${dto.hash ?? 'p:' + dto.perceptualHash}:${dto.mediaType.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.subject?.id) this.counters.bumpCheck(parsed.subject.id);
      return parsed;
    }

    const cryptoVerdict = dto.hash ? await this.crypto.lookupByHash(dto.hash) : null;

    // 2. Exact byte-hash lookup (unique index â€” sub-ms)
    if (dto.hash) {
      const subject = await this.prisma.subject.findUnique({
        where: { hash: dto.hash },
      });
      if (subject) return this.respond(subject, 'exact', cacheKey, cryptoVerdict);
    }

    // 3. Perceptual nearest-neighbor (Option B scan)
    if (dto.perceptualHash) {
      const candidates = await this.phashRepo.nearest(dto.perceptualHash, dto.mediaType, 8);
      if (candidates.length > 0) {
        return this.respond(candidates[0], 'perceptual', cacheKey, cryptoVerdict, {
          distance: candidates[0].distance,
          ambiguous: candidates.length > 1 && candidates[1].distance <= 8,
        });
      }
    }

    // 4. Miss â€” create subject ONLY when we have the exact hash
    if (dto.hash) {
      try {
        const subject = await this.prisma.subject.create({
          data: {
            hash: dto.hash,
            perceptualHash: dto.perceptualHash,
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
}
