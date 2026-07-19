import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MediaType, Subject } from '@prisma/client';

export interface SubjectDistance extends Subject {
  distance: number;
}

@Injectable()
export class SubjectPhashRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Option B: Postgres-native XOR scan over generated phash_bits.
   * Scans ~1M subjects in 20-60ms. Do not change to BK-tree.
   */
  async nearest(perceptualHash: string, mediaType: MediaType, maxDistance = 8): Promise<SubjectDistance[]> {
    // Injecting the raw hex into the bit string format required by Postgres.
    // The bits are safe: the schema pipe regex (/^[0-9a-f]{16}$/) guarantees it's pure hex.
    const hexLiteral = perceptualHash;

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, hash, "perceptualHash", "mediaType", "sizeBytes", "firstSeenAt", 
        "attestationCount", "verdictSummary", "checkCount",
        bit_count("phashBits" # ('x' || ${hexLiteral})::bit(64)) AS distance
      FROM "subjects"
      WHERE "mediaType"::text = ${mediaType}
        AND "phashBits" IS NOT NULL
        AND bit_count("phashBits" # ('x' || ${hexLiteral})::bit(64)) <= ${maxDistance}
      ORDER BY distance ASC
      LIMIT 5;
    `;

    return results.map(row => ({
      ...row,
      distance: Number(row.distance),
      sizeBytes: row.sizeBytes ? BigInt(row.sizeBytes) : null,
    }));
  }
}
