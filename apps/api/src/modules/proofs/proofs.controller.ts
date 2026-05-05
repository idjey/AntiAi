import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Param,
} from '@nestjs/common';
import { ProofsService } from './proofs.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IssueProofDto, ReissueProofDto } from './dto';

@Controller('proofs')
@UseGuards(JwtAuthGuard)
export class ProofsController {
    constructor(private readonly proofsService: ProofsService) { }

    @Get()
    async list(
        @CurrentUser() user: any,
        @Query('video_id') videoId?: string,
    ) {
        return this.proofsService.listUserProofs(user.id, videoId);
    }

    @Public()
    @Get('public/verify/:videoId')
    async verifyPublic(@Param('videoId') videoId: string) {
        return this.proofsService.getPublicProof(videoId);
    }

    @Public()
    @Get('public/verify/:platform/:videoId')
    async verifyPublicByPlatformId(
        @Param('platform') platform: string,
        @Param('videoId') videoId: string
    ) {
        return this.proofsService.getPublicProofByPlatformId(platform, videoId);
    }

    @Post('issue')
    @HttpCode(HttpStatus.OK)
    async issue(@CurrentUser() user: any, @Body() dto: IssueProofDto) {
        return this.proofsService.issueProof(user.id, dto);
    }

    @Post('reissue')
    @HttpCode(HttpStatus.OK)
    async reissue(@CurrentUser() user: any, @Body() dto: ReissueProofDto) {
        return this.proofsService.reissueProof(user.id, dto);
    }
}
