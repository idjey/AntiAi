import { Module, forwardRef } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { AttestationsModule } from '../attestations/attestations.module';
import { ConfigService } from './config.service';
import { LedgerService } from './ledger.service';
import { DecayWorker } from './decay.worker';

@Module({
  imports: [
    RedisModule,
    forwardRef(() => AttestationsModule),
  ],
  providers: [ConfigService, LedgerService, DecayWorker],
  exports: [ConfigService, LedgerService],
})
export class ReputationModule {}
