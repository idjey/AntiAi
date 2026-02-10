import { Module } from '@nestjs/common';
import { ProofsController } from './proofs.controller';
import { ProofsService } from './proofs.service';
import { VideosModule } from '../videos/videos.module';

@Module({
    imports: [VideosModule],
    controllers: [ProofsController],
    providers: [ProofsService],
    exports: [ProofsService],
})
export class ProofsModule { }
