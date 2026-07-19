import { Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';

export const REDIS_TOKEN = 'REDIS_INSTANCE';

export const InjectRedis = () => Inject(REDIS_TOKEN);

import { Inject } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_TOKEN,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });
      },
    },
  ],
  exports: [REDIS_TOKEN],
})
export class RedisModule {}
