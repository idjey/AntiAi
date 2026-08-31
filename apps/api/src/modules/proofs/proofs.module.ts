import { Module } from '@nestjs/common';
import { ProofsController } from './proofs.controller';
import { ProofsService } from './proofs.service';
import { VideosModule } from '../videos/videos.module';
import { PendingProofsCronService } from './pending-proofs.cron';

@Module({
    imports: [VideosModule],
    controllers: [ProofsController],
    providers: [ProofsService, PendingProofsCronService],
    exports: [ProofsService],
})
export class ProofsModule { }
