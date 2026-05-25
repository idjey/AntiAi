import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SecurityAlertService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService
    ) { }

    async checkAndAlertNewLogin(params: {
        userId: string;
        email: string;
        ipAddress: string;
        country: string;
        city: string;
        device: string;
    }) {
        try {
            const { userId, email, ipAddress, country, city, device } = params;

            // Check if there's any previous successful login from this IP OR Country for this user
            // We consider it "new" if we haven't seen this IP AND country combination before.
            const previousLogin = await this.prisma.authActivityLog.findFirst({
                where: {
                    userId,
                    status: 'SUCCESS',
                    OR: [
                        { ipAddress },
                        { country }
                    ],
                    // We only want to check logs BEFORE this current login we just recorded.
                    // Instead of complex timestamp logic, we'll just check if count > 1
                }
            });

            // Since the current login was already recorded, we check if count of successful logins
            // from this IP/Country is exactly 1 (meaning ONLY the current one exists).
            const count = await this.prisma.authActivityLog.count({
                where: {
                    userId,
                    status: 'SUCCESS',
                    ipAddress,
                    country
                }
            });

            // If count is 1, this is the FIRST time they logged in from this location successfully
            if (count === 1) {
                // To prevent spamming on brand new accounts, check if total successful logins > 1
                const totalLogins = await this.prisma.authActivityLog.count({
                    where: { userId, status: 'SUCCESS' }
                });

                if (totalLogins > 1) {
                    // Send alert!
                    const locationStr = city !== 'Unknown' && city ? `${city}, ${country}` : (country || 'Unknown Location');
                    await this.emailService.sendNewLoginAlertEmail(email, ipAddress, locationStr, device);
                }
            }

        } catch (error) {
            console.error('Failed to process security alert:', error);
        }
    }
}
