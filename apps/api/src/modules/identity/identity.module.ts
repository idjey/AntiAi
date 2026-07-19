import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { RedisModule } from '../redis/redis.module';

import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [IdentityController],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
