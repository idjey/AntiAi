import { HttpLog } from '@prisma/client';
import { LogSinkProvider } from './log-sink.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebhookSink implements LogSinkProvider {
    type = 'webhook';
    private readonly logger = new Logger(WebhookSink.name);

    async validate(config: Record<string, any>): Promise<{ valid: boolean; error?: string }> {
        if (!config.url || typeof config.url !== 'string' || !config.url.startsWith('http')) {
            return { valid: false, error: 'Invalid or missing URL' };
        }
        return { valid: true };
    }

    async testConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
        try {
            const method = config.method || 'POST';
            const headers = config.headers || {};
            
            const response = await fetch(config.url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: JSON.stringify({ event: 'test_connection', timestamp: new Date().toISOString() }),
                signal: AbortSignal.timeout(5000), // 5s timeout
            });

            if (response.ok) {
                return { success: true, message: `Successfully connected (HTTP ${response.status})` };
            } else {
                return { success: false, message: `Connected, but received HTTP ${response.status}` };
            }
        } catch (error: any) {
            return { success: false, message: `Connection failed: ${error.message}` };
        }
    }

    async forward(logs: HttpLog[], config: Record<string, any>): Promise<{ sent: number; failed: number; error?: string }> {
        try {
            const method = config.method || 'POST';
            const headers = config.headers || {};
            
            const response = await fetch(config.url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: JSON.stringify(logs),
                signal: AbortSignal.timeout(10000), // 10s timeout for actual batch
            });

            if (!response.ok) {
                throw new Error(`Webhook returned HTTP ${response.status}`);
            }

            return { sent: logs.length, failed: 0 };
        } catch (error: any) {
            this.logger.error(`Webhook forward failed: ${error.message}`);
            return { sent: 0, failed: logs.length, error: error.message };
        }
    }
}
