import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { google, youtube_v3 } from 'googleapis';

@Injectable()
export class YoutubeService {
    private readonly logger = new Logger(YoutubeService.name);
    private youtube: youtube_v3.Youtube;

    constructor() {
        if (!process.env.YOUTUBE_API_KEY) {
            this.logger.warn('YOUTUBE_API_KEY is not set in environment variables');
        }

        this.youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY,
        });
    }

    /**
     * Resolves a channel identifier (Handle string like "@user" or Channel ID like "UC...")
     * and returns the channel's designated "Uploads" playlist ID.
     */
    async getChannelUploadsPlaylistId(channelIdentifier: string): Promise<string | null> {
        try {
            let requestParams: youtube_v3.Params$Resource$Channels$List = {
                part: ['contentDetails'],
            };

            // Basic parsing to distinguish ID vs Handle
            if (channelIdentifier.startsWith('@')) {
                requestParams.forHandle = channelIdentifier;
            } else if (channelIdentifier.startsWith('UC') && channelIdentifier.length === 24) {
                requestParams.id = [channelIdentifier];
            } else {
                throw new BadRequestException('Invalid channel identifier (must be a @handle or a 24-char UC... ID)');
            }

            const response = await this.youtube.channels.list(requestParams);

            if (!response.data.items || response.data.items.length === 0) {
                return null;
            }

            const uploadsPlaylistId = response.data.items[0].contentDetails?.relatedPlaylists?.uploads;
            return uploadsPlaylistId || null;
        } catch (error: any) {
            this.logger.error(`Error fetching uploads playlist for ${channelIdentifier}: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to resolve YouTube channel: ${error.message}`);
        }
    }

    /**
     * Paginates through all items in a playlist and extracts video IDs and metadata.
     */
    async getAllVideosFromPlaylist(playlistId: string): Promise<Array<{ videoId: string, title: string, thumbnailUrl: string, publishedAt: string, channelId: string }>> {
        const videos: Array<{ videoId: string, title: string, thumbnailUrl: string, publishedAt: string, channelId: string }> = [];
        let nextPageToken: string | null | undefined = undefined;

        try {
            do {
                const response = await this.youtube.playlistItems.list({
                    part: ['contentDetails', 'snippet'],
                    playlistId: playlistId,
                    maxResults: 50,
                    pageToken: nextPageToken || undefined,
                });

                if (response.data.items) {
                    for (const item of response.data.items) {
                        const videoId = item.contentDetails?.videoId;
                        if (videoId) {
                            const snippet = item.snippet;
                            videos.push({
                                videoId: videoId,
                                title: snippet?.title || `Video ${videoId}`,
                                thumbnailUrl: snippet?.thumbnails?.maxres?.url || snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                                publishedAt: snippet?.publishedAt || new Date().toISOString(),
                                channelId: snippet?.videoOwnerChannelId || ''
                            });
                        }
                    }
                }

                nextPageToken = response.data.nextPageToken;
            } while (nextPageToken);

            return videos;
        } catch (error: any) {
            this.logger.error(`Error fetching playlist items for ${playlistId}: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to fetch videos from playlist: ${error.message}`);
        }
    }
}
