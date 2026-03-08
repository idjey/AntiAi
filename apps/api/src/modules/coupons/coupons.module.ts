import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [PrismaModule, EmailModule],
    controllers: [CouponsController],
    providers: [CouponsService],
    exports: [CouponsService],
})
export class CouponsModule { }
