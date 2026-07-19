import { Module } from '@nestjs/common';

import { ReputationModule } from '../reputation/reputation.module';
import { VouchesModule } from '../vouches/vouches.module';
import { SettlementService } from './settlement.service';
import { SettlementDomainEvents } from './domain-events';

@Module({
  imports: [ ReputationModule, VouchesModule],
  providers: [SettlementService, SettlementDomainEvents],
  exports: [SettlementService, SettlementDomainEvents],
})
export class SettlementModule {}
