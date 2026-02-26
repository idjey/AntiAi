import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) {
        // Fallback or actual SMTP config from env
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST') || 'smtp.sendgrid.net',
            port: this.configService.get<number>('SMTP_PORT') || 587,
            secure: this.configService.get<string>('SMTP_SECURE') === 'true', // true for 465, false for other ports
            auth: {
                user: this.configService.get<string>('SMTP_USER') || '',
                pass: this.configService.get<string>('SMTP_PASS') || '',
            },
        });
    }

    async sendOtpEmail(to: string, otp: string) {
        const mailOptions = {
            from: `"AntiAI" <${this.configService.get<string>('SMTP_FROM') || 'noreply@antiai.me'}>`,
            to,
            subject: 'Verify your email - AntiAI.me',
            html: this.getOtpTemplate(otp),
        };

        try {
            if (!this.configService.get<string>('SMTP_PASS')) {
                this.logger.warn(`SMTP_PASS not configured. Skipping actual email send to ${to}. Simulated OTP: ${otp}`);
                return;
            }
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent: ${info.messageId}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
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
}
