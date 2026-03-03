import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { YoutubeService } from './youtube.service';
import { ChannelsModule } from '../channels/channels.module';

@Module({
    imports: [ChannelsModule],
    controllers: [VideosController],
    providers: [VideosService, YoutubeService],
    exports: [VideosService, YoutubeService],
})
export class VideosModule { }
