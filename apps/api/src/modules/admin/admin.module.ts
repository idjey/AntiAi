
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminChannelsController } from './channels/admin-channels.controller';
import { AdminChannelsService } from './channels/admin-channels.service';
import { AdminVideosController } from './videos/admin-videos.controller';
import { AdminVideosService } from './videos/admin-videos.service';
import { AdminProofsController } from './proofs/admin-proofs.controller';
import { AdminProofsService } from './proofs/admin-proofs.service';
import { AdminReportsController } from './reports/admin-reports.controller';
import { AdminReportsService } from './reports/admin-reports.service';
import { AdminKeysController } from './keys/admin-keys.controller';
import { AdminKeysService } from './keys/admin-keys.service';
import { ProofsModule } from '../proofs/proofs.module';

@Module({
    imports: [ProofsModule],
    controllers: [AdminController, AdminChannelsController, AdminVideosController, AdminProofsController, AdminReportsController, AdminKeysController],
    providers: [AdminService, AdminChannelsService, AdminVideosService, AdminProofsService, AdminReportsService, AdminKeysService],
})
export class AdminModule { }
