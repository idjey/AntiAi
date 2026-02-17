
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminChannelsController } from './channels/admin-channels.controller';
import { AdminChannelsService } from './channels/admin-channels.service';

@Module({
    controllers: [AdminController, AdminChannelsController],
    providers: [AdminService, AdminChannelsService],
})
export class AdminModule { }
