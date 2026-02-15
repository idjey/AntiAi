import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Delete,
    Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideosService } from './videos.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImportVideoDto } from './dto';

@Controller('videos')
@UseGuards(AuthGuard('jwt'))
export class VideosController {
    constructor(private readonly videosService: VideosService) { }

    @Get()
    async list(
        @CurrentUser() user: any,
        @Query('channel_id') channelId?: string,
    ) {
        return this.videosService.listUserVideos(user.id, channelId);
    }

    @Get('lookup')
    @HttpCode(HttpStatus.OK)
    async lookup(@CurrentUser() user: any, @Query('url') url: string) {
        return this.videosService.lookupVideo(url);
    }

    @Post('import')
    @HttpCode(HttpStatus.OK)
    async import(@CurrentUser() user: any, @Body() dto: ImportVideoDto) {
        return this.videosService.importVideo(user.id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async delete(@CurrentUser() user: any, @Param('id') id: string) {
        return this.videosService.deleteVideo(user.id, id);
    }
}
