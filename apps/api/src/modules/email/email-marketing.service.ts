import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailMarketingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
        @InjectQueue('email-campaigns') private emailQueue: Queue,
    ) { }

    async createCampaign(data: {
        name: string; subject: string; htmlContent: string;
        audienceSegment: string; customEmails?: string;
    }) {
        return this.prisma.emailCampaign.create({
            data: {
                name: data.name,
                subject: data.subject,
                htmlContent: data.htmlContent,
                audienceSegment: data.customEmails ? 'custom' : data.audienceSegment,
                customEmails: data.customEmails || null,
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
        if (!prompt || prompt.trim().length < 3) {
            throw new BadRequestException('Prompt must be at least 3 characters');
        }

        const subjectLine = this.generateSubject(prompt);
        const htmlContent = this.generateBrandedHtml(prompt, subjectLine);

        return { subject: subjectLine, htmlContent };
    }

    private generateSubject(prompt: string): string {
        const p = prompt.toLowerCase();
        if (p.includes('welcome')) return '🎉 Welcome to AntiAI.me — Your Content Shield is Active';
        if (p.includes('update') || p.includes('news')) return '🚀 What\'s New at AntiAI.me — Product Updates Inside';
        if (p.includes('elite') || p.includes('upgrade')) return '⚡ Unlock Elite Powers — Exclusive Offer Inside';
        if (p.includes('security') || p.includes('deepfake')) return '🛡️ Deepfake Protection Just Got Stronger';
        if (p.includes('holiday') || p.includes('sale') || p.includes('discount')) return '🎁 Limited Time Offer — Save Big on AntiAI.me';
        if (p.includes('feature') || p.includes('launch')) return '✨ New Feature Alert — Check Out What We Built';
        if (p.includes('thank')) return '💚 Thank You for Being Part of AntiAI.me';
        return `📬 ${prompt.substring(0, 60)}`;
    }

    private generateBrandedHtml(prompt: string, subject: string): string {
        const p = prompt.toLowerCase();
        let headline = subject.replace(/^[^\s]+ /, '');
        let body = '';
        let ctaText = 'Visit AntiAI.me';
        let ctaUrl = 'https://antiai.me';

        if (p.includes('welcome')) {
            body = `<p style="color:#94a3b8;font-size:16px;line-height:1.7;">We're thrilled to have you on board! AntiAI.me is the world's first cryptographic content authentication platform — designed to protect your videos from deepfakes and impersonation.</p>
            <p style="color:#94a3b8;font-size:16px;line-height:1.7;">Here's how to get started:</p>
            <ul style="color:#94a3b8;font-size:15px;line-height:2;">
                <li><strong style="color:#22C55E;">Step 1:</strong> Verify your YouTube channel</li>
                <li><strong style="color:#22C55E;">Step 2:</strong> Import your videos</li>
                <li><strong style="color:#22C55E;">Step 3:</strong> Issue cryptographic proofs</li>
            </ul>`;
            ctaText = 'Go to Dashboard';
            ctaUrl = 'https://antiai.me/dashboard';
        } else if (p.includes('elite') || p.includes('upgrade')) {
            body = `<p style="color:#94a3b8;font-size:16px;line-height:1.7;">You've been doing great things. It's time to unlock the full power of AntiAI.me with our <strong style="color:#22C55E;">Elite Plan</strong>.</p>
            <p style="color:#94a3b8;font-size:16px;line-height:1.7;">Elite members get:</p>
            <ul style="color:#94a3b8;font-size:15px;line-height:2;">
                <li>✅ Unlimited video verifications</li>
                <li>✅ Bulk channel sync</li>
                <li>✅ Priority support</li>
                <li>✅ Custom creator card</li>
            </ul>`;
            ctaText = 'Upgrade to Elite';
            ctaUrl = 'https://antiai.me/upgrade';
        } else {
            body = `<p style="color:#94a3b8;font-size:16px;line-height:1.7;">${prompt}</p>
            <p style="color:#94a3b8;font-size:16px;line-height:1.7;">We're constantly working to make AntiAI.me the most trusted content verification platform. Stay tuned for more updates!</p>`;
        }

        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
        <img src="https://antiai.me/images/logo-dark.png" alt="AntiAI.me" style="height:40px;" />
    </div>
    <div style="background-color:#111827;border-radius:16px;padding:40px 32px;border:1px solid rgba(255,255,255,0.08);">
        <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 24px 0;line-height:1.3;">${headline}</h1>
        ${body}
        <div style="text-align:center;margin-top:32px;">
            <a href="${ctaUrl}" style="display:inline-block;background-color:#22C55E;color:#000000;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;">${ctaText}</a>
        </div>
    </div>
    <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="color:#475569;font-size:12px;margin:0;">© ${new Date().getFullYear()} AntiAI.me — Protecting Authenticity</p>
        <p style="color:#475569;font-size:11px;margin:8px 0 0 0;">
            <a href="https://antiai.me/privacy" style="color:#64748b;text-decoration:underline;">Privacy</a> · 
            <a href="https://antiai.me/terms" style="color:#64748b;text-decoration:underline;">Terms</a>
        </p>
    </div>
</div>
</body></html>`;
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

    async sendTestEmail(to: string, subject: string, htmlContent: string) {
        if (!to || !to.includes('@')) {
            throw new BadRequestException('Invalid email address');
        }
        await this.emailService.sendEmailGeneric(
            to,
            `[TEST] ${subject}`,
            htmlContent,
            'Please view this email in a client that supports HTML'
        );
        return { success: true, message: `Test email sent to ${to}` };
    }
}
