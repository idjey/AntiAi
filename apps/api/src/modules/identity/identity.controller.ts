import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { ChallengeRequestDto } from './dto/challenge-request.dto';
import { ChallengeResponseDto } from './dto/challenge-response.dto';
import { RegisterIdentityDto } from './dto/register-identity.dto';

@Controller('v1/identities')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('challenge')
  async challenge(@Body() dto: ChallengeRequestDto): Promise<ChallengeResponseDto> {
    return this.identityService.generateChallenge(dto.publicKey);
  }

  @Post('register')
  async register(@Body() dto: RegisterIdentityDto) {
    return this.identityService.registerIdentity(dto);
  }

  @Get(':keyId')
  async getIdentity(@Param('keyId') keyId: string) {
    const identity = await this.identityService.getIdentity(keyId);
    if (!identity) throw new NotFoundException('Identity not found');
    return identity;
  }
}
