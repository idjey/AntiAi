import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ProvenanceProcessor, DNS_LOOKUP } from './provenance.processor';
import { PhashService } from './phash.service';
import { getQueueToken } from '@nestjs/bullmq';
import { lookup } from 'node:dns/promises';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService, 
    PhashService, 
    ProvenanceProcessor,
    { provide: getQueueToken('aggregation'), useValue: { add: jest.fn() } },
    { provide: DNS_LOOKUP, useValue: lookup }
  ],
})
export class AppModule {}
