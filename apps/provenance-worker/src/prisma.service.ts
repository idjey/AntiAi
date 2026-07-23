import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@antiai/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
