import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core'; // Import APP_GUARD if needed, but string injection works too. actually APP_GUARD is from @nestjs/core
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { VideosModule } from './modules/videos/videos.module';
import { ProofsModule } from './modules/proofs/proofs.module';
import { PublicModule } from './modules/public/public.module';
import { BillingModule } from './modules/billing/billing.module';
import { UploadModule } from './modules/upload/upload.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { EmailModule } from './modules/email/email.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HealthController } from './health.controller';

@Module({
    imports: [
        // Environment configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),

        // Serve Static Files (Uploads) — explicitly enabled for Railway containers
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
        }),

        // Rate limiting
        // ThrottlerModule.forRoot([{
        //     ttl: 60000,
        //     limit: 100,
        // }]),

        // Database
        PrismaModule,

        // Feature modules
        AuthModule,
        ChannelsModule,
        VideosModule,
        ProofsModule,
        PublicModule,
        BillingModule,
        ProfilesModule,
        UploadModule,
        AnalyticsModule,
        AdminModule,
        EmailModule,
    ],
    providers: [
        // {
        //     provide: 'APP_GUARD',
        //     useClass: ThrottlerGuard,
        // },
    ],
    controllers: [HealthController],
})
export class AppModule { }
