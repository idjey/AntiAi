import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { YoutubeService } from './youtube.service';
import { ChannelsModule } from '../channels/channels.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [ChannelsModule, EmailModule],
    controllers: [VideosController],
    providers: [VideosService, YoutubeService],
    exports: [VideosService, YoutubeService],
})
export class VideosModule { }
