import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReputationConfig } from '@prisma/client';
import { Redis } from 'ioredis';
import { InjectRedis } from '../redis/redis.module';
import { ReputationParams, DEFAULT_CONFIG } from './types';

@Injectable()
export class ConfigService {
  private readonly CACHE_KEY = 'reputation:config:active';
  private readonly CACHE_TTL_SEC = 30;

  constructor(
    private prisma: PrismaService,
    @InjectRedis() private redis: Redis,
  ) {}

  /**
   * Fetches the currently active configuration, heavily cached for fast access.
   */
  async active(): Promise<{ id: number; params: ReputationParams }> {
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const activeConfig = await this.prisma.reputationConfig.findFirst({
      where: { active: true },
      orderBy: { id: 'desc' },
    });

    const result = activeConfig
      ? { id: activeConfig.id, params: activeConfig.params as unknown as ReputationParams }
      : { id: 0, params: DEFAULT_CONFIG }; // Fallback before any config is activated

    await this.redis.set(this.CACHE_KEY, JSON.stringify(result), 'EX', this.CACHE_TTL_SEC);
    return result;
  }

  /**
   * Proposes a new configuration version.
   */
  async proposeConfig(
    params: ReputationParams,
    comment: string,
    adminId: string,
  ): Promise<ReputationConfig> {
    return this.prisma.reputationConfig.create({
      data: {
        params: params as any,
        comment,
        activationRequestedBy: adminId,
      },
    });
  }

  /**
   * Dual-control activation: requires a second admin within 15 minutes of the proposal.
   */
  async activateConfig(configId: number, approvingAdminId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const config = await tx.reputationConfig.findUnique({
        where: { id: configId },
      });

      if (!config) throw new NotFoundException('Config not found');
      if (config.active) throw new BadRequestException('Config is already active');
      if (config.activationRequestedBy === approvingAdminId) {
        throw new BadRequestException('Dual-control violation: approving admin must differ from proposing admin');
      }

      const now = Date.now();
      const requestedAt = config.activationRequestedAt.getTime();
      const MIN_15_MS = 15 * 60 * 1000;

      if (now - requestedAt > MIN_15_MS) {
        throw new BadRequestException('Activation request expired (exceeded 15 minutes)');
      }

      // Deactivate the currently active config
      await tx.reputationConfig.updateMany({
        where: { active: true },
        data: { active: false },
      });

      // Activate the new one
      await tx.reputationConfig.update({
        where: { id: configId },
        data: {
          active: true,
          approvedBy: approvingAdminId,
          approvedAt: new Date(),
        },
      });

      // Bust the cache so the new config takes effect on the next read
      await this.redis.del(this.CACHE_KEY);
    });
  }
}
