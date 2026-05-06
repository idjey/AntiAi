import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';

@Processor('email-campaigns')
export class EmailWorker extends WorkerHost {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        console.log(`Processing job ${job.id} of type ${job.name}`);

        if (job.name === 'process-campaign') {
            await this.processCampaign(job.data.campaignId);
        }
    }

    private async processCampaign(campaignId: string) {
        const campaign = await this.prisma.emailCampaign.findUnique({
            where: { id: campaignId }
        });

        if (!campaign) {
            console.error(`Campaign ${campaignId} not found`);
            return;
        }

        console.log(`Starting to send campaign: ${campaign.name}`);

        // Fetch audience
        // For MVP, if audienceSegment === 'all', get all users who verified their email
        let users: { id: string; email: string }[] = [];
        if (campaign.audienceSegment === 'all') {
            users = await this.prisma.user.findMany({
                where: { isEmailVerified: true },
                select: { id: true, email: true },
            });
        } else if (campaign.audienceSegment === 'elite_only') {
            users = await this.prisma.user.findMany({
                where: {
                    isEmailVerified: true,
                    subscription: {
                        plan: 'elite',
                    }
                },
                select: { id: true, email: true },
            });
        }

        let sentCount = 0;
        let failCount = 0;

        // Iterate and send
        // In a real enterprise app, we would chunk these into smaller BullMQ jobs or use SendGrid/AWS SES batch send APIs.
        // For the MVP, we process them sequentially but asynchronously in the worker.
        for (const user of users) {
            try {
                // We use EmailService.sendEmailGeneric
                await this.emailService.sendEmailGeneric(
                    user.email,
                    campaign.subject,
                    campaign.htmlContent,
                    'Please view this email in a client that supports HTML'
                );

                // Log the send event
                await this.prisma.emailEvent.create({
                    data: {
                        campaignId,
                        userId: user.id,
                        email: user.email,
                        eventType: 'sent',
                    }
                });
                sentCount++;
            } catch (error) {
                console.error(`Failed to send email to ${user.email}`, error);
                await this.prisma.emailEvent.create({
                    data: {
                        campaignId,
                        userId: user.id,
                        email: user.email,
                        eventType: 'failed',
                    }
                });
                failCount++;
            }

            // Small delay to prevent rate-limiting from SMTP
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Mark campaign as sent
        await this.prisma.emailCampaign.update({
            where: { id: campaignId },
            data: {
                status: 'sent',
                sentAt: new Date(),
            }
        });

        console.log(`Campaign ${campaignId} finished sending. Sent: ${sentCount}, Failed: ${failCount}`);
    }
}
