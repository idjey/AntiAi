import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { ProofsModule } from '../proofs/proofs.module';

@Module({
    imports: [ProofsModule],
    controllers: [PublicController],
    providers: [PublicService],
})
export class PublicModule { }
