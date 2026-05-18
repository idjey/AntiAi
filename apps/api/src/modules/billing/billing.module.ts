import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { UsageResetService } from './usage-reset.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [BillingController],
    providers: [BillingService, UsageResetService],
    exports: [BillingService],
})
export class BillingModule { }
