import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WebhookSink } from './webhook.sink';
import { PostgresqlSink } from './postgresql.sink';
import { decryptConfig } from './crypto.utils';
import { LogSinkProvider } from './log-sink.interface';
import { HttpLog, LogSinkConfig } from '@prisma/client';

@Injectable()
export class LogSinkManager implements OnModuleInit {
    private readonly logger = new Logger(LogSinkManager.name);
    private providers: Map<string, LogSinkProvider> = new Map();

    constructor(
        private prisma: PrismaService,
        private webhookSink: WebhookSink,
        private postgresqlSink: PostgresqlSink
    ) {}

    onModuleInit() {
        this.providers.set(this.webhookSink.type, this.webhookSink);
        this.providers.set(this.postgresqlSink.type, this.postgresqlSink);
    }

    getProvider(type: string): LogSinkProvider | undefined {
        return this.providers.get(type);
    }

    async processBatchForSink(sink: LogSinkConfig) {
        try {
            const provider = this.getProvider(sink.type);
            if (!provider) {
                this.logger.error(`Unknown sink type: ${sink.type}`);
                return;
            }

            const config = JSON.parse(decryptConfig(sink.config));
            
            // Build query to fetch new logs for this sink
            const whereClause: any = {};
            
            if (sink.lastForwardedAt) {
                whereClause.timestamp = { gt: sink.lastForwardedAt };
            }
            
            if (sink.filterMethods.length > 0) {
                whereClause.method = { in: sink.filterMethods };
            }
            
            if (sink.filterMinStatus) {
                whereClause.statusCode = { gte: sink.filterMinStatus };
            }

            if (sink.filterPaths.length > 0) {
                // Prisma doesn't have an easy array prefix match without raw SQL or multiple startsWith
                // For simplicity in this iteration, we'll fetch and filter in memory if needed, or use OR
                whereClause.OR = sink.filterPaths.map(p => ({ path: { startsWith: p } }));
            }

            const logs = await this.prisma.httpLog.findMany({
                where: whereClause,
                orderBy: { timestamp: 'asc' },
                take: 1000, // Process in chunks of 1000
            });

            if (logs.length === 0) return;

            const result = await provider.forward(logs, config);

            if (result.failed === 0) {
                // Success - update cursor
                const lastLog = logs[logs.length - 1];
                await this.prisma.logSinkConfig.update({
                    where: { id: sink.id },
                    data: {
                        lastForwardedAt: lastLog.timestamp,
                        lastForwardedId: lastLog.id,
                        errorCount: 0,
                        lastError: null
                    }
                });
                this.logger.debug(`Forwarded ${result.sent} logs to sink ${sink.name}`);
            } else {
                // Failed - increment error count
                const newErrorCount = sink.errorCount + 1;
                await this.prisma.logSinkConfig.update({
                    where: { id: sink.id },
                    data: {
                        errorCount: newErrorCount,
                        lastError: result.error,
                        enabled: newErrorCount >= 10 ? false : true // Auto-disable after 10 failures
                    }
                });
                this.logger.warn(`Failed to forward logs to sink ${sink.name}. Error count: ${newErrorCount}`);
            }
        } catch (error: any) {
            this.logger.error(`Error processing sink ${sink.name}: ${error.message}`);
        }
    }
}
