import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CryptoLookupService {
  constructor(private prisma: PrismaService) {}

  async lookupByHash(hash: string) {
    const proof = await this.prisma.proof.findFirst({
      where: { contentHash: hash, status: 'active' },
      include: {
        channel: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    });

    if (!proof) return null;

    return this.mapProofToVerdict(proof);
  }

  async lookupByPerceptualHash(phashes: { fraction: number, hash: string }[], maxDistance = 12, majorityRequired = 2) {
    if (!phashes || phashes.length === 0) return null;

    // Build the dynamic WHERE clause for positional matching
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const ph of phashes) {
      if (ph.hash.length !== 16) continue;
      whereClauses.push(`(anchor_fraction = $${paramIndex} AND bit_count(phash_bits # ('x' || $${paramIndex + 1})::bit(64)) <= ${maxDistance})`);
      params.push(ph.fraction);
      params.push(ph.hash);
      paramIndex += 2;
    }

    if (whereClauses.length === 0) return null;

    const query = `
      SELECT proof_id, COUNT(*) as matches
      FROM proof_perceptual_hashes
      WHERE ${whereClauses.join(' OR ')}
      GROUP BY proof_id
      HAVING COUNT(*) >= ${majorityRequired}
      ORDER BY matches DESC
      LIMIT 1
    `;

    const results = await this.prisma.$queryRawUnsafe<Array<{ proof_id: string, matches: number }>>(query, ...params);
    
    if (results.length === 0) {
      return null;
    }

    const proof = await this.prisma.proof.findUnique({
      where: { id: results[0].proof_id },
      include: {
        channel: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    });

    if (!proof || proof.status !== 'active') return null;

    return this.mapProofToVerdict(proof);
  }

  private mapProofToVerdict(proof: any) {
    return {
      status: 'VERIFIED',
      issuedAt: proof.issuedAt,
      expiresAt: proof.expiresAt,
      channel: {
        handle: proof.channel.channelHandle,
        name: proof.channel.channelName,
        verified: proof.channel.verificationStatus === 'verified',
      }
    };
  }
}

