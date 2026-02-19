
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AdminBillingController } from './billing/admin-billing.controller';
import { AdminBillingService } from './billing/admin-billing.service';
import { AdminLogsController } from './logs/admin-logs.controller';
import { AdminLogsService } from './logs/admin-logs.service';
import { AdminSettingsController } from './settings/admin-settings.controller';
import { AdminSettingsService } from './settings/admin-settings.service';
import { ProofsModule } from '../proofs/proofs.module';
import { AdminModerationModule } from './moderation/admin-moderation.module';

@Module({
    imports: [
        AdminModerationModule,
        ProofsModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' }, // Impersonation token duration
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AdminController, AdminChannelsController, AdminVideosController, AdminProofsController, AdminReportsController, AdminKeysController, AdminBillingController, AdminLogsController, AdminSettingsController],
    providers: [AdminService, AdminChannelsService, AdminVideosService, AdminProofsService, AdminReportsService, AdminKeysService, AdminBillingService, AdminLogsService, AdminSettingsService],
})
export class AdminModule { }
