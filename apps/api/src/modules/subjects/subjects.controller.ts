import { Controller, Post, Get, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { SubjectsService } from './subjects.service';
import { ResolveDto, resolveSchema, ZodValidationPipe } from './dto/resolve.dto';
import { computePhash } from '@antiai/phash';
import fileType from 'file-type';

@Controller('v1/subjects')
@UseGuards(ThrottlerGuard)
export class SubjectsController {
  constructor(private service: SubjectsService) {}

  @Post('phash')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // Rate limit: 20 per minute
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB cap
  }))
  async phash(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new UnsupportedMediaTypeException('No file uploaded or unsupported media type');
    }

    // MIME sniff the actual bytes
    const typeInfo = await fileType.fromBuffer(file.buffer);
    if (!typeInfo || !typeInfo.mime.startsWith('image/')) {
      throw new UnsupportedMediaTypeException('Only images are supported for perceptual hashing');
    }

    // Compute the perceptual hash using the shared module
    const perceptualHash = await computePhash(file.buffer);
    
    // Bytes are processed and discarded (not saved to disk)
    return { perceptualHash };
  }

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
