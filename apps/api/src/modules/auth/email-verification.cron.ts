import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class EmailVerificationCronService {
    private readonly logger = new Logger(EmailVerificationCronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    // Run every 10 minutes to process reminders and suspensions
    @Cron('*/10 * * * *')
    async handleEmailVerificationEnforcement() {
        this.logger.log('Running email verification enforcement job...');
        
        try {
            await this.processReminders();
            await this.processSuspensions();
        } catch (error) {
            this.logger.error('Failed to execute email verification enforcement', error);
        }
    }

    private async processReminders() {
        // We want to send up to 4 reminders over 48 hours (1 every 12 hours)
        // First reminder starts at 10 minutes after creation.
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        // Find users who need their FIRST reminder
        const usersNeedingFirstReminder = await this.prisma.user.findMany({
            where: {
                isEmailVerified: false,
                isSuspended: false,
                createdAt: { lt: tenMinutesAgo },
                verificationReminderCount: 0,
                role: 'creator',
            },
            take: 50,
        });

        // Find users who need SUBSEQUENT reminders (1 to 3)
        const usersNeedingSubsequentReminder = await this.prisma.user.findMany({
            where: {
                isEmailVerified: false,
                isSuspended: false,
                verificationReminderCount: { gt: 0, lt: 4 },
                lastVerificationReminderSentAt: { lt: twelveHoursAgo },
                role: 'creator',
            },
            take: 50,
        });

        const usersToRemind = [...usersNeedingFirstReminder, ...usersNeedingSubsequentReminder];

        for (const user of usersToRemind) {
            try {
                // Generate a fresh OTP for the reminder
                const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
                const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        otp,
                        otpExpiresAt,
                        verificationReminderCount: { increment: 1 },
                        lastVerificationReminderSentAt: new Date(),
                    }
                });

                await this.emailService.sendVerificationReminderEmail(user.email, otp, user.verificationReminderCount + 1);
                this.logger.log(`Sent verification reminder #${user.verificationReminderCount + 1} to ${user.email}`);
            } catch (err) {
                this.logger.error(`Failed to send reminder to ${user.email}`, err);
            }
        }
    }

    private async processSuspensions() {
        // Suspend users who are still unverified after 48 hours AND have received 4 reminders
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const usersToSuspend = await this.prisma.user.findMany({
            where: {
                isEmailVerified: false,
                isSuspended: false,
                createdAt: { lt: fortyEightHoursAgo },
                verificationReminderCount: { gte: 4 },
                role: 'creator',
            },
            take: 50,
        });

        for (const user of usersToSuspend) {
            try {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        isSuspended: true,
                    }
                });

                await this.emailService.sendAccountSuspensionEmail(user.email);
                this.logger.log(`Suspended unverified account ${user.email}`);
            } catch (err) {
                this.logger.error(`Failed to suspend account ${user.email}`, err);
            }
        }
    }
}
