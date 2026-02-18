
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminChannelsController } from './channels/admin-channels.controller';
import { AdminChannelsService } from './channels/admin-channels.service';
import { AdminVideosController } from './videos/admin-videos.controller';
import { AdminVideosService } from './videos/admin-videos.service';

@Module({
    controllers: [AdminController, AdminChannelsController, AdminVideosController],
    providers: [AdminService, AdminChannelsService, AdminVideosService],
})
export class AdminModule { }
