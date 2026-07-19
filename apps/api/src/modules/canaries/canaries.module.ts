import { Module, forwardRef } from '@nestjs/common';

import { ReputationModule } from '../reputation/reputation.module';
import { CanariesService } from './canaries.service';
import { CanariesController } from './canaries.controller';
import { TasksController } from './tasks.controller';
import { ClusteringWorker } from './clustering.worker';

@Module({
  imports: [forwardRef(() => ReputationModule)],
  controllers: [CanariesController, TasksController],
  providers: [CanariesService, ClusteringWorker],
  exports: [CanariesService],
})
export class CanariesModule {}
