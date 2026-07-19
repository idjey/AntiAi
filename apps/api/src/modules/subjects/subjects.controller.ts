import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { SubjectsService } from './subjects.service';
import { ResolveDto, resolveSchema, ZodValidationPipe } from './dto/resolve.dto';

@Controller('v1/subjects')
@UseGuards(ThrottlerGuard)
export class SubjectsController {
  constructor(private service: SubjectsService) {}

  @Post('resolve')
  @Throttle({ default: { limit: 100, ttl: 60_000 } }) // Share sheets hit this heavily
  async resolve(
    @Body(new ZodValidationPipe(resolveSchema)) dto: ResolveDto,
  ) {
    return this.service.resolve(dto);
  }

  @Get(':hash')
  async getDetail(@Param('hash') hash: string) {
    return this.service.getDetail(hash);
  }

  @Get(':hash/attestations')
  async getTimeline(
    @Param('hash') hash: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 25;
    return this.service.getTimeline(hash, cursor, Math.min(limit, 100));
  }
}
