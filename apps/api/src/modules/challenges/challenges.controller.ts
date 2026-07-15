import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChallengesService } from './challenges.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('challenges')
@UseGuards(AuthGuard('jwt'))
export class ChallengesController {
    constructor(private readonly challengesService: ChallengesService) {}

    @Post()
    async createChallenge(@CurrentUser() user: any, @Body() body: { videoId: string, channelId: string }) {
        return this.challengesService.createChallenge(user.id, body.videoId, body.channelId);
    }

    @Post(':id/verify')
    async verifyChallenge(@Param('id') id: string, @Body() body: any) {
        return this.challengesService.verifyChallenge(id, body);
    }
}
