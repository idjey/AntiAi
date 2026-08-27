import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { UsageResetService } from './usage-reset.service';
import { SlaService } from './sla.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [BillingController],
    providers: [BillingService, UsageResetService, SlaService],
    exports: [BillingService, SlaService],
})
export class BillingModule { }
