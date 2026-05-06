import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) {
        // We will keep the nodemailer transport code intact for alternative SMTP providers,
        // but it will be bypassed if using Resend, which requires REST over HTTPS.
        const secureStr = String(this.configService.get<string>('SMTP_SECURE') || 'false').toLowerCase();

        // Fallback or actual SMTP config from env
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST') || 'smtp.sendgrid.net',
            port: Number(this.configService.get<string>('SMTP_PORT')) || 587,
            secure: secureStr === 'true', // true for 465, false for other ports
            auth: {
                user: this.configService.get<string>('SMTP_USER') || '',
                pass: this.configService.get<string>('SMTP_PASS') || '',
            },
            connectionTimeout: 10000, // 10 seconds timeout
            socketTimeout: 15000, // 15 seconds socket timeout
            greetingTimeout: 10000, // 10 seconds greeting timeout
        });
    }

    async sendOtpEmail(to: string, otp: string) {
        const apiKey = this.configService.get<string>('SMTP_PASS');
        const host = this.configService.get<string>('SMTP_HOST');
        const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@antiai.me';

        try {
            if (!apiKey) {
                this.logger.warn(`SMTP_PASS not configured. Skipping actual email send to ${to}. Simulated OTP: ${otp}`);
                return;
            }

            // RAILWAY FIX: Railway blocks outbound SMTP on ports 25, 587, and 465 for security.
            // If the provider is Resend, we intercept it and use their HTTPS REST API (Port 443) which is never blocked.
            if (host === 'smtp.resend.com') {
                this.logger.log(`Attempting to send OTP email to ${to} via Resend REST API (HTTPS)...`);
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: `AntiAI <${fromEmail}>`,
                        to: [to],
                        subject: 'Verify your email - AntiAI.me',
                        html: this.getOtpTemplate(otp)
                    })
                });

                if (!response.ok) {
                    const errorResponse = await response.text();
                    throw new Error(`Resend API Error: ${response.status} ${errorResponse}`);
                }

                const data = await response.json();
                this.logger.log(`Email sent successfully via REST API: ${data.id}`);
                return;
            }

            // Fallback to SMTP NodeMailer for other providers 
            this.logger.log(`Attempting to send OTP email to ${to} via ${host}:${Number(this.configService.get<string>('SMTP_PORT')) || 587}...`);
            const info = await this.transporter.sendMail({
                from: `"AntiAI" <${fromEmail}>`,
                to,
                subject: 'Verify your email - AntiAI.me',
                html: this.getOtpTemplate(otp),
            });
            this.logger.log(`Email sent successfully via SMTP: ${info.messageId}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}. Is SMTP properly configured on Railway? Error:`, error);
        }
    }

    private getOtpTemplate(otp: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0B0F14;
            color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            width: 48px;
            height: 48px;
        }
        .logo-text {
            font-size: 24px;
            font-weight: bold;
            display: inline-block;
            vertical-align: top;
            margin-top: 8px;
            margin-left: 12px;
            color: #ffffff;
            text-decoration: none;
        }
        .logo-text span {
            color: #22C55E;
        }
        .card {
            background-color: #1a2234;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .title {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 16px 0;
            color: #ffffff;
        }
        .description {
            font-size: 15px;
            color: #94A3B8;
            margin: 0 0 32px 0;
            line-height: 1.5;
        }
        .otp-container {
            background-color: #0f172a;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #22C55E;
            margin: 0;
            font-family: 'Courier New', Courier, monospace;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 13px;
            color: #64748B;
        }
        .footer a {
            color: #22C55E;
            text-decoration: none;
        }
    </style>
</head>
<body style="background-color: #0B0F14; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
    <div class="container" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div class="header" style="text-align: center; margin-bottom: 40px;">
            <a href="https://antiai.me" style="text-decoration: none;">
                <img src="https://antiai.me/logo.svg" alt="AntiAI.me" style="width: 48px; height: 48px; display: inline-block;">
                <div style="font-size: 24px; font-weight: bold; display: inline-block; vertical-align: top; margin-top: 8px; margin-left: 12px; color: #ffffff;">
                    antiai<span style="color: #22C55E;">.me</span>
                </div>
            </a>
        </div>
        
        <div class="card" style="background-color: #1a2234; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; text-align: center;">
            <h1 class="title" style="font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: #ffffff;">Verify your email address</h1>
            <p class="description" style="font-size: 15px; color: #94A3B8; margin: 0 0 32px 0; line-height: 1.5;">
                Welcome to AntiAI.me! To complete your signup and verify this email address, please enter the verification code below in the app.
            </p>
            
            <div class="otp-container" style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid rgba(255, 255, 255, 0.05);">
                <p class="otp-code" style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #22C55E; margin: 0; font-family: 'Courier New', Courier, monospace;">
                    ${otp}
                </p>
            </div>
            
            <p class="description" style="margin-bottom: 0; font-size: 13px; color: #94A3B8; line-height: 1.5;">
                This code will expire in 10 minutes. If you didn't request this email, you can safely ignore it.
            </p>
        </div>
        
        <div class="footer" style="text-align: center; margin-top: 40px; font-size: 13px; color: #64748B;">
            <p>&copy; ${new Date().getFullYear()} AntiAI.me. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    async sendVerificationSummary(to: string, videoTitles: string[]) {
        const apiKey = this.configService.get<string>('SMTP_PASS');
        const host = this.configService.get<string>('SMTP_HOST');
        const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@antiai.me';

        const subject = `Verified ${videoTitles.length} Videos - AntiAI.me`;
        const html = this.getVerificationSummaryTemplate(videoTitles);

        try {
            if (!apiKey) {
                this.logger.warn(`SMTP_PASS not configured. Skipping actual email send to ${to}. Subject: ${subject}`);
                return;
            }

            if (host === 'smtp.resend.com') {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: `AntiAI Elite <${fromEmail}>`,
                        to: [to],
                        subject,
                        html
                    })
                });

                if (!response.ok) {
                    const errorResponse = await response.text();
                    throw new Error(`Resend API Error: ${response.status} ${errorResponse}`);
                }
                return;
            }

            await this.transporter.sendMail({
                from: `"AntiAI Elite" <${fromEmail}>`,
                to,
                subject,
                html,
            });
        } catch (error) {
            this.logger.error(`Failed to send verification summary email to ${to}`, error);
        }
    }

    private getVerificationSummaryTemplate(videoTitles: string[]): string {
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        let videosHtml = '';
        if (videoTitles.length > 5) {
            videosHtml = videoTitles.slice(0, 5).map(t => `<li style="margin-bottom: 8px;">${t}</li>`).join('');
            videosHtml += `<li style="margin-bottom: 8px;">...and ${videoTitles.length - 5} more videos</li>`;
        } else {
            videosHtml = videoTitles.map(t => `<li style="margin-bottom: 8px;">${t}</li>`).join('');
        }

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Summary</title>
</head>
<body style="background-color: #0B0F14; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <a href="https://antiai.me" style="text-decoration: none;">
                <div style="font-size: 24px; font-weight: bold; color: #ffffff;">
                    antiai<span style="color: #22C55E;">.me</span>
                </div>
            </a>
        </div>
        
        <div style="background-color: #1a2234; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px;">
            <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: #ffffff;">Validation Complete 🎉</h1>
            <p style="font-size: 15px; color: #94A3B8; margin: 0 0 24px 0; line-height: 1.5;">
                We successfully generated cryptographic proofs for <strong>${videoTitles.length} videos</strong> on ${date}. They are now permanently protected.
            </p>
            
            <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid rgba(255, 255, 255, 0.05);">
                <h3 style="margin-top: 0; color: #EAB308; font-size: 16px;">Synced Videos</h3>
                <ul style="color: #94A3B8; font-size: 14px; padding-left: 20px; list-style-type: disc;">
                    ${videosHtml}
                </ul>
            </div>
            
            <p style="margin-bottom: 0; font-size: 13px; color: #94A3B8; line-height: 1.5;">
                You can review the full proofs at any time directly in your <a href="https://antiai.me/dashboard/videos" style="color: #EAB308;">creator dashboard</a>.
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; font-size: 13px; color: #64748B;">
            <p>&copy; ${new Date().getFullYear()} AntiAI.me. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    // ─── Coupon Emails ───

    public async sendEmailGeneric(to: string, subject: string, html: string, textFallback?: string) {
        const apiKey = this.configService.get<string>('SMTP_PASS');
        const host = this.configService.get<string>('SMTP_HOST');
        const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@antiai.me';
        const unsubscribeUrl = `https://antiai.me/unsubscribe?email=${encodeURIComponent(to)}`;

        try {
            if (!apiKey) {
                this.logger.warn(`SMTP_PASS not configured. Skipping email to ${to}. Subject: ${subject}`);
                return;
            }

            if (host === 'smtp.resend.com') {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: `AntiAI <${fromEmail}>`,
                        to: [to],
                        subject,
                        html,
                        text: textFallback || this.stripHtml(html),
                        headers: {
                            'List-Unsubscribe': `<${unsubscribeUrl}>`,
                            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                            'Precedence': 'bulk',
                            'X-Mailer': 'AntiAI Platform',
                        }
                    })
                });
                if (!response.ok) {
                    const errorResponse = await response.text();
                    throw new Error(`Resend API Error: ${response.status} ${errorResponse}`);
                }
                return;
            }

            await this.transporter.sendMail({
                from: `"AntiAI" <${fromEmail}>`,
                to,
                subject,
                html,
                text: textFallback || this.stripHtml(html),
                headers: {
                    'List-Unsubscribe': `<${unsubscribeUrl}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                    'Precedence': 'bulk',
                },
            });
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        }
    }

    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    private getEmailFooter(recipientEmail: string): string {
        const unsubscribeUrl = `https://antiai.me/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
        return `
            <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05);">
                <p style="font-size: 12px; color: #475569; margin: 0 0 8px 0; line-height: 1.6;">
                    &copy; ${new Date().getFullYear()} AntiAI.me &middot; Protecting creator authenticity
                </p>
                <p style="font-size: 11px; color: #334155; margin: 0 0 8px 0;">
                    You're receiving this because you registered or subscribed at antiai.me
                </p>
                <a href="${unsubscribeUrl}" style="font-size: 11px; color: #475569; text-decoration: underline;">Unsubscribe</a>
            </div>`;
    }

    async sendCouponEmail(to: string, couponCode: string, discountValue: number, discountType: string) {
        const discountText = discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`;
        const upgradeUrl = `https://antiai.me/upgrade?coupon=${encodeURIComponent(couponCode)}`;
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Your AntiAI Discount</title>
</head>
<body style="background-color: #0a0a0a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
            <a href="https://antiai.me" style="text-decoration: none;">
                <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">anti</span><span style="font-size: 22px; font-weight: 700; color: #EF4444; letter-spacing: -0.5px;">ai</span><span style="font-size: 22px; font-weight: 700; color: #22C55E; letter-spacing: -0.5px;">.me</span>
            </a>
        </div>

        <!-- Card -->
        <div style="background-color: #111827; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 48px 40px; text-align: center;">
            <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 12px 0; color: #ffffff;">Welcome to AntiAI</h1>
            <p style="font-size: 15px; color: #94A3B8; margin: 0 0 36px 0; line-height: 1.6;">
                Here's your exclusive <strong style="color: #EF4444;">${discountText} OFF</strong> coupon for your first Pro or Elite upgrade.
            </p>

            <!-- Coupon Code -->
            <div style="background-color: #0a0a0a; border-radius: 12px; padding: 20px 24px; margin-bottom: 32px; border: 1px dashed rgba(239,68,68,0.4);">
                <p style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #EF4444; margin: 0; font-family: 'Courier New', Courier, monospace;">${couponCode}</p>
            </div>

            <!-- CTA Button -->
            <a href="${upgradeUrl}" style="display: inline-block; background-color: #EF4444; color: #ffffff; font-weight: 700; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-size: 15px; letter-spacing: 0.3px;">Upgrade Now</a>

            <p style="margin-top: 28px; font-size: 13px; color: #64748B; line-height: 1.5;">
                This coupon expires in 30 days.<br>Only valid for free-plan users upgrading to Pro or Elite.
            </p>
        </div>

        ${this.getEmailFooter(to)}
    </div>
</body>
</html>`;

        const textFallback = `Welcome to AntiAI!\n\nHere's your exclusive ${discountText} OFF coupon: ${couponCode}\n\nUpgrade now: ${upgradeUrl}\n\nThis coupon expires in 30 days. Only valid for free-plan users.`;

        await this.sendEmailGeneric(to, `Your ${discountText} OFF Coupon Code - AntiAI.me`, html, textFallback);
    }

    async sendPromotionalCoupon(to: string, couponCode: string, discountValue: number, discountType: string, expiresAt?: Date | null) {
        const discountText = discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`;
        const expiryText = expiresAt ? `Valid until ${expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : 'Limited time offer';
        const upgradeUrl = `https://antiai.me/upgrade?coupon=${encodeURIComponent(couponCode)}`;
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Exclusive AntiAI Offer</title>
</head>
<body style="background-color: #0a0a0a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
            <a href="https://antiai.me" style="text-decoration: none;">
                <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">anti</span><span style="font-size: 22px; font-weight: 700; color: #EF4444; letter-spacing: -0.5px;">ai</span><span style="font-size: 22px; font-weight: 700; color: #22C55E; letter-spacing: -0.5px;">.me</span>
            </a>
        </div>

        <!-- Card -->
        <div style="background-color: #111827; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 48px 40px; text-align: center;">
            <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 12px 0; color: #ffffff;">Exclusive Discount</h1>
            <p style="font-size: 15px; color: #94A3B8; margin: 0 0 36px 0; line-height: 1.6;">
                You've been selected for <strong style="color: #22C55E;">${discountText} OFF</strong> on Pro and Elite plans. Don't let this one expire.
            </p>

            <!-- Coupon Code -->
            <div style="background-color: #0a0a0a; border-radius: 12px; padding: 20px 24px; margin-bottom: 32px; border: 1px dashed rgba(34,197,94,0.4);">
                <p style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #22C55E; margin: 0; font-family: 'Courier New', Courier, monospace;">${couponCode}</p>
            </div>

            <!-- CTA Button -->
            <a href="${upgradeUrl}" style="display: inline-block; background-color: #22C55E; color: #000000; font-weight: 700; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-size: 15px; letter-spacing: 0.3px;">Claim Your Discount</a>

            <p style="margin-top: 28px; font-size: 13px; color: #64748B; line-height: 1.5;">
                ${expiryText}<br>Only valid for free-plan users upgrading to Pro or Elite.
            </p>
        </div>

        ${this.getEmailFooter(to)}
    </div>
</body>
</html>`;

        const textFallback = `Exclusive AntiAI Discount!\n\nYou've been selected for ${discountText} OFF: ${couponCode}\n\nClaim your discount: ${upgradeUrl}\n\n${expiryText}. Only valid for free-plan users.`;

        await this.sendEmailGeneric(to, `${discountText} OFF Your AntiAI Upgrade`, html, textFallback);
    }
    async sendPasswordResetEmail(to: string, otp: string) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Reset Your Password</title>
</head>
<body style="background-color: #0a0a0a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <a href="https://antiai.me" style="text-decoration: none;">
                <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">anti</span><span style="font-size: 22px; font-weight: 700; color: #22C55E; letter-spacing: -0.5px;">ai</span><span style="font-size: 22px; font-weight: 700; color: #64748B; letter-spacing: -0.5px;">.me</span>
            </a>
        </div>
        <div style="background-color: #111827; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 48px 40px; text-align: center;">
            <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 12px 0; color: #ffffff;">Reset Your Password</h1>
            <p style="font-size: 15px; color: #94A3B8; margin: 0 0 36px 0; line-height: 1.6;">
                We received a request to reset your password. Enter the code below to securely reset it.
            </p>
            <div style="background-color: #0a0a0a; border-radius: 12px; padding: 20px 24px; margin-bottom: 32px; border: 1px dashed rgba(34,197,94,0.4);">
                <p style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #22C55E; margin: 0; font-family: 'Courier New', Courier, monospace;">${otp}</p>
            </div>
            <p style="margin-top: 28px; font-size: 13px; color: #64748B; line-height: 1.5;">
                This code will expire in 10 minutes. If you didn't request this email, you can safely ignore it.
            </p>
        </div>
        ${this.getEmailFooter(to)}
    </div>
</body>
</html>`;
        const textFallback = `We received a request to reset your password.\n\nYour reset code is: ${otp}\n\nThis code will expire in 10 minutes.`;
        await this.sendEmailGeneric(to, `Reset your AntiAI.me password`, html, textFallback);
    }
}
