import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto';
import { EmailService } from '../email/email.service';
import { CouponsService } from '../coupons/coupons.service';
import { Request } from 'express';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { AuthLoggingService } from './auth-logging.service';
import { SecurityAlertService } from './security-alert.service';

@Injectable()
export class AuthService implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
        private readonly couponsService: CouponsService,
        private readonly authLoggingService: AuthLoggingService,
        private readonly securityAlertService: SecurityAlertService,
    ) { }

    async onModuleInit() {
        try {
            await this.prisma.user.updateMany({
                where: { role: 'admin' },
                data: {
                    isSuspended: false,
                    isEmailVerified: true,
                    verificationReminderCount: 0
                }
            });
            console.log('Admins verified and unsuspended automatically on startup.');
        } catch (error) {
            console.error('Failed to run admin unsuspension check', error);
        }
    }

    private normalizeEmail(email: string): string {
        let [localPart, domain] = email.toLowerCase().trim().split('@');
        if (domain === 'gmail.com' || domain === 'googlemail.com') {
            localPart = localPart.replace(/\./g, '');
            localPart = localPart.split('+')[0];
            domain = 'gmail.com';
        }
        return `${localPart}@${domain}`;
    }

    async signup(dto: SignupDto) {
        // Check for disable_signups setting
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'disable_signups' },
        });
        if (setting?.value === 'true') {
            throw new BadRequestException('Signups are currently disabled.');
        }

        const normalizedEmail = this.normalizeEmail(dto.email);

        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            if (existingUser.isEmailVerified) {
                throw new BadRequestException('Email already registered');
            } else {
                // User exists but is unverified. Resend OTP and allow them to proceed.
                return this.resendOtp(existingUser.email);
            }
        }

        // Check if handle exists
        const existingHandle = await this.prisma.creatorProfile.findUnique({
            where: { handle: dto.handle.toLowerCase() },
        });

        if (existingHandle) {
            throw new BadRequestException('Handle already taken');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Generate OTP
        const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user with free subscription and profile
        const user = await this.prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                otp,
                otpExpiresAt,
                subscription: {
                    create: {
                        plan: 'free',
                        status: 'active',
                    },
                },
                profile: {
                    create: {
                        handle: dto.handle.toLowerCase(),
                        displayName: dto.handle, // Default display name to handle
                    }
                }
            },
            include: {
                profile: true,
            }
        });

        // Send OTP
        await this.emailService.sendOtpEmail(user.email, otp);

        // Generate welcome coupon (fire-and-forget, don't block signup)
        this.couponsService.generateWelcomeCoupon(user.id, user.email).catch(err => {
            console.error('Welcome coupon generation failed:', err.message);
        });

        // Send alert to admin
        try {
            await this.emailService.sendEmailGeneric(
                'admin@antiai.me',
                `New Creator Signup: ${dto.email}`,
                `A new creator has signed up for AntiAI.<br/><br/>Email: ${dto.email}<br/>Handle: ${user.profile?.handle || dto.handle}<br/>Time: ${new Date().toISOString()}`,
                `A new creator has signed up for AntiAI. Email: ${dto.email}, Handle: ${user.profile?.handle || dto.handle}`
            );
        } catch (err) {
            console.error('Failed to send admin signup alert', err);
        }

        return {
            message: 'Signup successful. Please verify your email with the OTP sent.',
            email: user.email
        };
    }

    async verifyOtp(email: string, otp: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // 1. Check if account is temporarily locked
        if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
            throw new UnauthorizedException('Too many failed attempts. Try again in 30 minutes.');
        }

        // 2. Check if OTP is expired
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            throw new BadRequestException('OTP expired');
        }

        // 3. Check if OTP is incorrect
        if (user.otp !== otp) {
            const newAttempts = user.failedOtpAttempts + 1;
            const updateData: any = { failedOtpAttempts: newAttempts };

            // Lock for 30 minutes on 3rd failure
            if (newAttempts >= 3) {
                updateData.otpLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
                updateData.failedOtpAttempts = 0; // Reset counter for next time
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });

            if (newAttempts >= 3) {
                throw new UnauthorizedException('Too many failed attempts. Account locked for 30 minutes.');
            }
            throw new BadRequestException('Invalid OTP');
        }

        // Clear OTP, unlock account, and mark verified
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otp: null,
                otpExpiresAt: null,
                failedOtpAttempts: 0,
                otpLockedUntil: null,
                isEmailVerified: true,
                isSuspended: false,
                verificationReminderCount: 0,
                lastVerificationReminderSentAt: null,
            },
        });

        // Generate JWT
        const token = await this.generateToken(user.id);

        return {
            access_token: token,
            token_type: 'Bearer',
            expires_in: this.getExpiresIn(),
        };
    }

    async resendOtp(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email already verified. Please log in.');
        }

        // 1. Check if account is temporarily locked
        if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
            throw new UnauthorizedException('Account is locked from too many failed attempts. Try again later.');
        }

        // Generate new OTP
        const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otp,
                otpExpiresAt,
                failedOtpAttempts: 0, // Reset failures on new request
            },
        });

        // Send OTP
        await this.emailService.sendOtpEmail(user.email, otp);

        return {
            message: 'A new verification code has been sent to your email.',
            email: user.email,
        };
    }

    async login(dto: LoginDto, req: Request) {
        // 1. Check Rate Limiting / Lockout
        // We look for failed login attempts in the last 15 minutes for this email
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentFailures = await this.prisma.authActivityLog.count({
            where: {
                email: dto.email.toLowerCase(),
                status: 'FAILED',
                createdAt: { gte: fifteenMinsAgo }
            }
        });

        if (recentFailures >= 3) {
            await this.authLoggingService.logActivity({
                req,
                email: dto.email.toLowerCase(),
                status: 'BLOCKED',
                failureReason: 'Account temporarily locked due to multiple failed attempts'
            });
            throw new UnauthorizedException('Too many failed attempts. Try again in 15 minutes.');
        }

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
            await this.authLoggingService.logActivity({
                req,
                email: dto.email.toLowerCase(),
                status: 'FAILED',
                failureReason: 'User not found or missing password hash'
            });
            throw new UnauthorizedException('Invalid email or password');
        }

        if (user.isSuspended) {
            await this.authLoggingService.logActivity({
                req,
                email: dto.email.toLowerCase(),
                userId: user.id,
                status: 'FAILED',
                failureReason: 'Account suspended'
            });
            throw new UnauthorizedException('Account suspended. Please verify your email or contact support to restore access.');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            await this.authLoggingService.logActivity({
                req,
                email: dto.email.toLowerCase(),
                userId: user.id,
                status: 'FAILED',
                failureReason: 'Invalid password'
            });
            throw new UnauthorizedException('Invalid email or password');
        }

        // If 2FA is enabled, do not issue the final JWT yet. Issue a temp token.
        if (user.twoFactorEnabled) {
            // Generate a temporary JWT specifically for 2FA verification
            const tempToken = await this.jwtService.signAsync(
                { sub: user.id, type: '2fa' },
                { expiresIn: '5m' } // 5 minutes to complete 2FA
            );
            return {
                requires2FA: true,
                tempToken,
                message: 'Please complete two-factor authentication.',
            };
        }

        // --- SUCCESSFUL LOGIN FLOW ---
        
        // Log successful login and get location info
        const logData = await this.authLoggingService.logActivity({
            req,
            email: user.email,
            userId: user.id,
            status: 'SUCCESS'
        });

        // Trigger New Login Email if applicable
        if (logData) {
            await this.securityAlertService.checkAndAlertNewLogin({
                userId: user.id,
                email: user.email,
                ipAddress: logData.ipAddress,
                country: logData.country || 'Unknown',
                city: logData.city || 'Unknown',
                device: logData.device
            });
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate JWT
        const token = await this.generateToken(user.id);

        return {
            access_token: token,
            token_type: 'Bearer',
            expires_in: this.getExpiresIn(),
        };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                subscription: {
                    select: {
                        plan: true,
                        status: true
                    }
                },
                profile: {
                    select: {
                        handle: true,
                        displayName: true,
                        avatarUrl: true,
                    }
                }
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    async validateUser(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                subscription: {
                    select: {
                        plan: true,
                        status: true
                    }
                }
            },
        });
    }

    private async generateToken(userId: string): Promise<string> {
        const payload = { sub: userId };
        return this.jwtService.signAsync(payload);
    }

    private getExpiresIn(): number {
        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
        // Convert to seconds
        if (expiresIn.endsWith('d')) {
            return parseInt(expiresIn) * 24 * 60 * 60;
        }
        if (expiresIn.endsWith('h')) {
            return parseInt(expiresIn) * 60 * 60;
        }
        return 3600; // Default 1 hour
    }
    async checkHandle(handle: string) {
        const normalizedHandle = handle.toLowerCase();

        const existing = await this.prisma.creatorProfile.findUnique({
            where: { handle: normalizedHandle },
        });

        if (!existing) {
            return { available: true };
        }

        // Generate suggestions
        const candidates = [
            `${normalizedHandle}${Math.floor(Math.random() * 1000)}`,
            `${normalizedHandle}_official`,
            `real_${normalizedHandle}`,
            `${normalizedHandle}_${new Date().getFullYear()}`,
            `iam${normalizedHandle}`
        ];

        const existingCandidates = await this.prisma.creatorProfile.findMany({
            where: {
                handle: { in: candidates }
            },
            select: { handle: true }
        });

        const takenHandles = new Set(existingCandidates.map(c => c.handle));
        const suggestions = candidates.filter(c => !takenHandles.has(c));

        return { available: false, suggestions: suggestions.slice(0, 3) };
    }
    async changePassword(userId: string, dto: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('User not found');
        }

        const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid current password');
        }

        const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });

        return { message: 'Password updated successfully' };
    }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return { message: 'If an account exists, a password reset email has been sent.' };
        }

        // Generate OTP for reset
        const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otp,
                otpExpiresAt,
                failedOtpAttempts: 0,
            },
        });

        await this.emailService.sendPasswordResetEmail(user.email, otp);

        return { message: 'If an account exists, a password reset email has been sent.' };
    }

    async resetPassword(email: string, otp: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
            throw new UnauthorizedException('Too many failed attempts. Try again in 30 minutes.');
        }

        if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            throw new BadRequestException('OTP expired');
        }

        if (user.otp !== otp) {
            const newAttempts = user.failedOtpAttempts + 1;
            const updateData: any = { failedOtpAttempts: newAttempts };

            if (newAttempts >= 3) {
                updateData.otpLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
                updateData.failedOtpAttempts = 0;
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });

            if (newAttempts >= 3) {
                throw new UnauthorizedException('Too many failed attempts. Account locked for 30 minutes.');
            }
            throw new BadRequestException('Invalid OTP');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                otp: null,
                otpExpiresAt: null,
                failedOtpAttempts: 0,
                otpLockedUntil: null,
            },
        });

        return { message: 'Password reset successful. You can now log in.' };
    }
    async validateOAuthUser(profile: any) {
        const { email, firstName, lastName, provider, providerId } = profile;

        // 1. Check if OAuthAccount exists
        const oauthAccount = await this.prisma.oAuthAccount.findUnique({
            where: {
                provider_providerUserId: {
                    provider,
                    providerUserId: providerId,
                },
            },
            include: { user: true },
        });

        if (oauthAccount) {
            // Login
            const token = await this.generateToken(oauthAccount.userId);
            return {
                access_token: token,
                token_type: 'Bearer',
                expires_in: this.getExpiresIn(),
            };
        }

        // 2. Check if User exists by email
        let user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (user) {
            // Link Account
            await this.prisma.oAuthAccount.create({
                data: {
                    userId: user.id,
                    provider,
                    providerUserId: providerId,
                },
            });
        } else {
            // 3. Create New User (WITHOUT profile — they'll create it on the dashboard)
            user = await this.prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    isEmailVerified: true, // Google verified
                    subscription: {
                        create: {
                            plan: 'free',
                            status: 'active',
                        },
                    },
                    oauthAccounts: {
                        create: {
                            provider,
                            providerUserId: providerId,
                        }
                    }
                },
            });

            // Generate welcome coupon (fire-and-forget)
            this.couponsService.generateWelcomeCoupon(user.id, user.email).catch(err => {
                console.error('Welcome coupon generation failed:', err.message);
            });
        }

        const token = await this.generateToken(user.id);
        return {
            access_token: token,
            token_type: 'Bearer',
            expires_in: this.getExpiresIn(),
        };
    }

    // --- 2FA Methods ---

    async generate2faSecret(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('User not found');

        const secret = authenticator.generateSecret();
        // Generate otpauth url
        const otpauthUrl = authenticator.keyuri(user.email, 'AntiAI', secret);

        // Save secret temporarily (we don't enable it yet until they verify it)
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });

        const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

        return {
            secret,
            qrCodeDataUrl,
        };
    }

    async enable2fa(userId: string, code: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            throw new BadRequestException('2FA secret not found. Generate it first.');
        }

        const isValid = authenticator.verify({
            token: code,
            secret: user.twoFactorSecret
        });

        if (!isValid) {
            throw new BadRequestException('Invalid 2FA code');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });

        return { message: '2FA enabled successfully' };
    }

    async disable2fa(userId: string, code: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new BadRequestException('2FA is not enabled');
        }

        const isValid = authenticator.verify({
            token: code,
            secret: user.twoFactorSecret
        });

        if (!isValid) {
            throw new BadRequestException('Invalid 2FA code');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        });

        return { message: '2FA disabled successfully' };
    }

    async verify2faLogin(tempToken: string, code: string, req: Request) {
        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(tempToken);
        } catch (e) {
            throw new UnauthorizedException('Session expired. Please log in again.');
        }

        if (payload.type !== '2fa') {
            throw new UnauthorizedException('Invalid token type');
        }

        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.twoFactorSecret) {
            throw new UnauthorizedException('User not found or 2FA not set up');
        }

        const isValid = authenticator.verify({
            token: code,
            secret: user.twoFactorSecret
        });

        if (!isValid) {
            await this.authLoggingService.logActivity({
                req,
                email: user.email,
                userId: user.id,
                status: 'FAILED',
                failureReason: 'Invalid 2FA code'
            });
            throw new UnauthorizedException('Invalid 2FA code');
        }

        // 2FA SUCCESS
        const logData = await this.authLoggingService.logActivity({
            req,
            email: user.email,
            userId: user.id,
            status: 'SUCCESS'
        });

        if (logData) {
            await this.securityAlertService.checkAndAlertNewLogin({
                userId: user.id,
                email: user.email,
                ipAddress: logData.ipAddress,
                country: logData.country || 'Unknown',
                city: logData.city || 'Unknown',
                device: logData.device
            });
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const finalToken = await this.generateToken(user.id);

        return {
            access_token: finalToken,
            token_type: 'Bearer',
            expires_in: this.getExpiresIn(),
        };
    }
}
