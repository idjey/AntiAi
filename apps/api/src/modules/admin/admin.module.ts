
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
import { AdminHttpLogsController } from './logs/admin-http-logs.controller';
import { AdminHttpLogsService } from './logs/admin-http-logs.service';
import { AdminSettingsController } from './settings/admin-settings.controller';
import { AdminSettingsService } from './settings/admin-settings.service';
import { ProofsModule } from '../proofs/proofs.module';
import { AdminModerationModule } from './moderation/admin-moderation.module';
import { EmailModule } from '../email/email.module';
import { BullModule } from '@nestjs/bull';
import { LogSinkConfigController } from './logs/sinks/log-sink-config.controller';
import { LogSinkConfigService } from './logs/sinks/log-sink-config.service';
import { LogSinkManager } from './logs/sinks/log-sink.manager';
import { WebhookSink } from './logs/sinks/webhook.sink';
import { PostgresqlSink } from './logs/sinks/postgresql.sink';
import { LogForwardingProcessor } from './logs/sinks/log-forwarding.processor';
import { LogForwarderCronService } from './logs/sinks/log-forwarder.cron';
import { LogRetentionCronService } from './logs/sinks/log-retention.cron';

@Module({
    imports: [
        AdminModerationModule,
        ProofsModule,
        EmailModule,
        BullModule.registerQueue({
            name: 'log-forwarding'
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' }, // Impersonation token duration
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AdminController, AdminChannelsController, AdminVideosController, AdminProofsController, AdminReportsController, AdminKeysController, AdminBillingController, AdminLogsController, AdminHttpLogsController, AdminSettingsController, LogSinkConfigController],
    providers: [AdminService, AdminChannelsService, AdminVideosService, AdminProofsService, AdminReportsService, AdminKeysService, AdminBillingService, AdminLogsService, AdminHttpLogsService, AdminSettingsService, LogSinkConfigService, LogSinkManager, WebhookSink, PostgresqlSink, LogForwardingProcessor, LogForwarderCronService, LogRetentionCronService],
})
export class AdminModule { }
