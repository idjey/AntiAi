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

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async signup(dto: SignupDto) {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existingUser) {
            throw new BadRequestException('Email already registered');
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

        // Send OTP (Mock for now)
        console.log(`[AUTH] sent OTP to ${user.email}: ${otp}`);

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

        if (user.otp !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            throw new BadRequestException('OTP expired');
        }

        // Clear OTP and mark verified
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otp: null,
                otpExpiresAt: null,
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
}
