import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto';
import { EmailService } from '../email/email.service';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
        private readonly couponsService: CouponsService,
    ) { }

    async signup(dto: SignupDto) {
        // Check for disable_signups setting
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'disable_signups' },
        });
        if (setting?.value === 'true') {
            throw new BadRequestException('Signups are currently disabled.');
        }

        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
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
                email: dto.email.toLowerCase(),
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
        });

        // Send OTP
        await this.emailService.sendOtpEmail(user.email, otp);

        // Generate welcome coupon (fire-and-forget, don't block signup)
        this.couponsService.generateWelcomeCoupon(user.id, user.email).catch(err => {
            console.error('Welcome coupon generation failed:', err.message);
        });

        return {
            message: 'Signup successful. Please verify your email with the OTP sent.',
            email: user.email,
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

    async login(dto: LoginDto) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid email or password');
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
}
