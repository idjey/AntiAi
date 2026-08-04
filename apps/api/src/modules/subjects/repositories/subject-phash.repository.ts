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
    if (!perceptualHash || typeof perceptualHash !== 'string' || !/^[0-9a-fA-F]{16}$/.test(perceptualHash)) {
      console.warn(`[SubjectPhashRepository] Invalid perceptualHash requested for nearest-neighbor scan: "${perceptualHash}"`);
      return [];
    }

    const hexLiteral = perceptualHash;

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, hash, "perceptualHash", "mediaType", "sizeBytes", "firstSeenAt", 
        "attestationCount", "verdictSummary", "checkCount",
        (CASE 
          WHEN length("perceptualHash") = 16 AND "perceptualHash" ~ '^[0-9a-fA-F]+$'
          THEN bit_count(('x' || "perceptualHash")::bit(64) # ('x' || ${hexLiteral})::bit(64))
          ELSE 999
        END) AS distance
      FROM "subjects"
      WHERE "mediaType"::text = ${mediaType}
        AND "perceptualHash" IS NOT NULL
        AND (CASE 
          WHEN length("perceptualHash") = 16 AND "perceptualHash" ~ '^[0-9a-fA-F]+$'
          THEN bit_count(('x' || "perceptualHash")::bit(64) # ('x' || ${hexLiteral})::bit(64))
          ELSE 999
        END) <= ${maxDistance}
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
