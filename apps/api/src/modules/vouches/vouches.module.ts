import { Module } from '@nestjs/common';

import { ReputationModule } from '../reputation/reputation.module';
import { VouchesService } from './vouches.service';

@Module({
  imports: [ ReputationModule],
  providers: [VouchesService],
  exports: [VouchesService],
})
export class VouchesModule {}
