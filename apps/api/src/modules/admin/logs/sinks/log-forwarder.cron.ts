import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class LogForwarderCronService {
    private readonly logger = new Logger(LogForwarderCronService.name);

    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('log-forwarding') private readonly logQueue: Queue
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async enqueueLogForwarding() {
        // Find all active sinks
        const activeSinks = await this.prisma.logSinkConfig.findMany({
            where: { enabled: true }
        });

        if (activeSinks.length === 0) return;

        // Queue a job for each sink
        // The processor will fetch the latest logs for that sink and forward them
        for (const sink of activeSinks) {
            await this.logQueue.add(
                'process-sink',
                { sinkId: sink.id },
                {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 2000 // 2s, 4s, 8s, 16s...
                    },
                    removeOnComplete: true,
                    removeOnFail: false // Keep failed jobs in queue for inspection
                }
            );
        }
        
        this.logger.debug(`Queued log forwarding for ${activeSinks.length} sinks.`);
    }
}
