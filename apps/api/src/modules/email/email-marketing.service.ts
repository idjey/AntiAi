import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailMarketingService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('email-campaigns') private emailQueue: Queue,
    ) { }

    async createCampaign(data: { name: string; subject: string; htmlContent: string; audienceSegment: string }) {
        return this.prisma.emailCampaign.create({
            data: {
                name: data.name,
                subject: data.subject,
                htmlContent: data.htmlContent,
                audienceSegment: data.audienceSegment,
            },
        });
    }

    async updateCampaign(id: string, data: any) {
        return this.prisma.emailCampaign.update({
            where: { id },
            data,
        });
    }

    async getCampaigns() {
        return this.prisma.emailCampaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });
    }

    async getCampaign(id: string) {
        const campaign = await this.prisma.emailCampaign.findUnique({
            where: { id },
            include: {
                events: {
                    take: 100,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!campaign) throw new NotFoundException('Campaign not found');
        return campaign;
    }

    async sendCampaign(id: string) {
        const campaign = await this.prisma.emailCampaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        if (campaign.status === 'sending' || campaign.status === 'sent') {
            throw new BadRequestException('Campaign is already sending or sent');
        }

        await this.prisma.emailCampaign.update({
            where: { id },
            data: { status: 'sending' },
        });

        // Enqueue job to process in background
        await this.emailQueue.add('process-campaign', {
            campaignId: id,
        }, {
            removeOnComplete: true,
            removeOnFail: false,
        });

        return { success: true, message: 'Campaign queued for sending' };
    }

    async generateWithAi(prompt: string) {
        // Mocked AI generation for now, real integration with OpenAI/Anthropic will happen next.
        return {
            subject: 'Generated Subject: ' + prompt.substring(0, 20),
            htmlContent: `<h1>AI Generated Content</h1><p>Based on your prompt: ${prompt}</p>`,
        };
    }

    async recordEvent(campaignId: string, email: string, eventType: string, userId?: string) {
        return this.prisma.emailEvent.create({
            data: {
                campaignId,
                email,
                eventType,
                userId,
            }
        });
    }
}
