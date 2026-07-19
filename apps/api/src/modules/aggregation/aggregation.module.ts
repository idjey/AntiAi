import { Module } from '@nestjs/common';
import { AggregationProcessor } from './aggregation.processor';
import { RedisModule } from '../redis/redis.module';
import { WeightsService } from './weights.service';
import { ReputationModule } from '../reputation/reputation.module';

@Module({
  imports: [RedisModule, ReputationModule],
  providers: [AggregationProcessor, WeightsService],
  exports: [WeightsService],
})
export class AggregationModule {}
