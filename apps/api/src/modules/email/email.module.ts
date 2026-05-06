import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailMarketingService } from './email-marketing.service';
import { EmailMarketingController } from './email-marketing.controller';
import { EmailWorker } from './email.worker';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email-campaigns',
        }),
    ],
    controllers: [EmailMarketingController],
    providers: [EmailService, EmailMarketingService, EmailWorker],
    exports: [EmailService, EmailMarketingService],
})
export class EmailModule { }
