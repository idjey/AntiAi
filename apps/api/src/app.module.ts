import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { VideosModule } from './modules/videos/videos.module';
import { ProofsModule } from './modules/proofs/proofs.module';
import { PublicModule } from './modules/public/public.module';
import { BillingModule } from './modules/billing/billing.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { HealthController } from './health.controller';

@Module({
    imports: [
        // Environment configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),

        // Rate limiting
        ThrottlerModule.forRoot([{
            ttl: 60000, // 1 minute
            limit: 100,  // 100 requests per minute
        }]),

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
    ],
    controllers: [HealthController],
})
export class AppModule { }

