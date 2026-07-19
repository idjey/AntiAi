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
