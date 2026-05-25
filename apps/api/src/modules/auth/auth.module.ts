import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailModule } from '../email/email.module';
import { CouponsModule } from '../coupons/coupons.module';
import { EmailVerificationCronService } from './email-verification.cron';
import { AuthLoggingService } from './auth-logging.service';
import { SecurityAlertService } from './security-alert.service';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
                },
            }),
        }),
        PassportModule,
        EmailModule,
        CouponsModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService, 
        JwtStrategy, 
        GoogleStrategy, 
        EmailVerificationCronService, 
        AuthLoggingService, 
        SecurityAlertService
    ],
    exports: [AuthService, JwtModule, AuthLoggingService],
})
export class AuthModule { }
