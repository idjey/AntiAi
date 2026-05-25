import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { LogSinkManager } from './log-sink.manager';
import { PrismaService } from '../../../../prisma/prisma.service';

@Processor('log-forwarding')
export class LogForwardingProcessor {
    constructor(
        private readonly manager: LogSinkManager,
        private readonly prisma: PrismaService
    ) {}

    @Process('process-sink')
    async handleProcessSink(job: Job<{ sinkId: string }>) {
        const sink = await this.prisma.logSinkConfig.findUnique({
            where: { id: job.data.sinkId }
        });

        if (!sink || !sink.enabled) {
            return; // Sink was deleted or disabled after job was queued
        }

        await this.manager.processBatchForSink(sink);
    }
}
