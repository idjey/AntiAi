import { Injectable, Inject, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { REDIS_TOKEN } from '../redis/redis.module';
import { Redis } from 'ioredis';
import { RegisterIdentityDto } from './dto/register-identity.dto';
import { ChallengeResponseDto } from './dto/challenge-response.dto';
import { verifyDetached, deriveKeyId } from '@antiai/attestation-core';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IdentityService {
  constructor(
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    private readonly prisma: PrismaService
  ) {}

  validatePublicKey(publicKeyB64: string): void {
    const buffer = Buffer.from(publicKeyB64, 'base64');
    if (buffer.length !== 32) {
      throw new BadRequestException('Invalid Ed25519 public key structure');
    }
  }

  async generateChallenge(publicKey: string): Promise<ChallengeResponseDto> {
    this.validatePublicKey(publicKey);
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    await this.redis.set(`challenge:${publicKey}`, nonce, 'EX', 300);
    
    return {
      nonce,
      expiresAt
    };
  }

  async registerIdentity(dto: RegisterIdentityDto) {
    this.validatePublicKey(dto.publicKey);
    const challengeKey = `challenge:${dto.publicKey}`;
    const nonce = await this.redis.get(challengeKey);
    
    if (!nonce) {
      throw new BadRequestException('Challenge expired or invalid');
    }
    
    // Single-use challenge semantics
    await this.redis.del(challengeKey);
    
    const publicKeyHex = Buffer.from(dto.publicKey, 'base64').toString('hex');
    const nonceBytes = Buffer.from(nonce, 'utf8');
    
    const isValid = verifyDetached(nonceBytes, dto.challengeSignature, publicKeyHex);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }
    
    const keyId = deriveKeyId(dto.publicKey);
    
    // Idempotent duplicate registration
    let identity = await this.prisma.verifierIdentity.findUnique({
      where: { keyId }
    });
    
    if (!identity) {
      identity = await this.prisma.verifierIdentity.create({
        data: {
          keyId,
          publicKey: dto.publicKey,
          platform: dto.platform,
          deviceAttested: !!dto.deviceAttestationToken,
          reputation: 0.10, // Initial probational reputation
        }
      });
    }
    
    return {
      keyId: identity.keyId,
      status: identity.status,
      identityClass: identity.identityClass,
      attestationCount: identity.attestationCount,
      displayHandle: identity.displayHandle
    };
  }

  async getIdentity(keyId: string) {
    const identity = await this.prisma.verifierIdentity.findUnique({
      where: { keyId },
      select: {
        keyId: true,
        identityClass: true,
        status: true,
        attestationCount: true,
        displayHandle: true
      }
    });
    return identity;
  }
}
