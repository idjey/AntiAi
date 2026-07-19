import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AttestationsController } from './attestations.controller';
import { AttestationsService } from './attestations.service';
import { EnvelopeVerifierService } from './services/envelope-verifier.service';
import { IdentityCacheService } from './services/identity-cache.service';
import { RateLimitService } from './services/rate-limit.service';
import { IdempotencyService } from './services/idempotency.service';
import { RedisModule } from '../redis/redis.module';

import { CanariesModule } from '../canaries/canaries.module';

@Module({
  imports: [
    RedisModule,
    forwardRef(() => CanariesModule),
    BullModule.registerQueue({ name: 'aggregation' }),
    BullModule.registerQueue({ name: 'provenance-verify' }),
  ],
  controllers: [AttestationsController],
  providers: [
    AttestationsService,
    EnvelopeVerifierService,
    IdentityCacheService,
    RateLimitService,
    IdempotencyService,
  ],
  exports: [AttestationsService, IdentityCacheService],
})
export class AttestationsModule {}
