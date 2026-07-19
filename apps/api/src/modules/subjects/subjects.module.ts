import { Module } from '@nestjs/common';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { CounterService } from './services/counter.service';
import { CryptoLookupService } from './services/crypto-lookup.service';
import { SubjectPhashRepository } from './repositories/subject-phash.repository';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [SubjectsController],
  providers: [
    SubjectsService,
    CounterService,
    CryptoLookupService,
    SubjectPhashRepository,
  ],
  exports: [SubjectsService],
})
export class SubjectsModule {}
