import { Controller, Post, Get, Body, Param, UseGuards, Res } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AttestationsService, SubmitResult } from './attestations.service';
import { SubmitAttestationDto, submitAttestationSchema, ZodValidationPipe } from './dto/submit-attestation.dto';

@Controller('v1/attestations')
@UseGuards(ThrottlerGuard)                    // step 0 — IP-level, pre-auth
export class AttestationsController {
  constructor(private service: AttestationsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })   // per-IP; generous, catches floods only
  async submit(
    @Body(new ZodValidationPipe(submitAttestationSchema)) dto: SubmitAttestationDto,
    @Res({ passthrough: true }) res: any
  ): Promise<SubmitResult> {
    const result = await this.service.submit(dto);
    if (result.duplicate) {
      res.status(200);
    }
    return result;
  }

  @Get(':payloadHash')
  async getOne(@Param('payloadHash') hash: string) {
    return this.service.findByPayloadHash(hash);
  }
}
