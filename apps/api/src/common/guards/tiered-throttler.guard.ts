import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions, ThrottlerGetTrackerFunction, ThrottlerGenerateKeyFunction, InjectThrottlerOptions, InjectThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerStorage } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';
import { SlaService } from '../../modules/billing/sla.service';
import { PlanTier } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class TieredThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() protected readonly options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly slaService: SlaService,
  ) {
    super(options, storageService, reflector);
  }

  private async resolveIdentity(req: Record<string, any>): Promise<{ userId?: string; orgId?: string; tier: PlanTier }> {
    let userId: string | undefined;
    let orgId: string | undefined = req.params?.organizationId || req.body?.organizationId || req.query?.organizationId;
    let tier: PlanTier = PlanTier.free;

    // Check for API Key or JWT in headers since this guard runs before AuthGuards
    const authHeader = req.headers['x-api-key'] || req.headers['authorization'];
    if (authHeader) {
      let rawToken = authHeader;
      if (rawToken.startsWith('Bearer ')) {
        rawToken = rawToken.split(' ')[1];
        // Note: Full JWT verification is left to JwtAuthGuard, but we can decode it here for rate limiting if we wanted to.
        // However, since we might not want to do full JWT decode if it's complex, we can just let API keys be the main focus for SLAs.
        // If it's a dashboard request (JWT), they usually don't hit API rate limits as hard, but let's try to extract if we can.
        // For simplicity, let's assume we mainly care about API Keys for the SLA.
      } else {
        // API Key
        const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });
        if (apiKey) {
          userId = apiKey.userId;
        }
      }
    }

    if (!userId && req.user) userId = req.user.id;
    if (!userId && req.apiKey) userId = req.apiKey.userId;

    if (orgId && userId) {
      const membership = await this.prisma.teamMember.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId } }
      });
      if (membership) {
        const orgSub = await this.prisma.organizationSubscription.findUnique({
          where: { organizationId: orgId },
          select: { tier: true }
        });
        if (orgSub) tier = orgSub.tier;
      }
    } 
    
    if (tier === PlanTier.free && userId) {
      const userSub = await this.prisma.subscription.findUnique({
        where: { userId },
        select: { plan: true }
      });
      if (userSub) tier = userSub.plan;
    }

    // Attach to request so we don't look it up twice
    req.slaIdentity = { userId, orgId, tier };
    return req.slaIdentity;
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const identity = req.slaIdentity || await this.resolveIdentity(req);
    
    if (identity.orgId) {
      return `org:${identity.orgId}`;
    }
    if (identity.userId) {
      return `user:${identity.userId}`;
    }
    return req.ips?.length ? req.ips[0] : req.ip;
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
    getTracker: ThrottlerGetTrackerFunction,
    generateKey: ThrottlerGenerateKeyFunction,
  ): Promise<boolean> {
    const { req, res } = this.getRequestResponse(context);

    const identity = req.slaIdentity || await this.resolveIdentity(req);
    const tier = identity.tier;

    let resolvedLimit = limit;
    let resolvedTtl = ttl;

    if (identity.userId) {
      const rateLimitConfig = this.slaService.getRateLimit(tier);
      resolvedLimit = rateLimitConfig.limit;
      resolvedTtl = rateLimitConfig.ttl;
    }

    return super.handleRequest(context, resolvedLimit, resolvedTtl, throttler, getTracker, generateKey);
  }
}
