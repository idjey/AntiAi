import { Controller, Post, Get, Body, Param, UseGuards, Res, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AttestationsService, SubmitResult } from './attestations.service';
import { SubmitAttestationDto, submitAttestationSchema, ZodValidationPipe } from './dto/submit-attestation.dto';
import { PlanTier } from '@prisma/client';

@Controller('v1/attestations')

export class AttestationsController {
  constructor(private service: AttestationsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })   // per-IP; generous, catches floods only
  async submit(
    @Req() req: any,
    @Body(new ZodValidationPipe(submitAttestationSchema)) dto: SubmitAttestationDto,
    @Res({ passthrough: true }) res: any
  ): Promise<SubmitResult> {
    const tier = req.slaIdentity?.tier || PlanTier.free;
    const result = await this.service.submit(dto, tier);
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
