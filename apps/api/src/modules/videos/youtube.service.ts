import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class YoutubeService {
    private readonly logger = new Logger(YoutubeService.name);
    private readonly apiKey: string;

    constructor() {
        if (!process.env.YOUTUBE_API_KEY) {
            this.logger.warn('YOUTUBE_API_KEY is not set in environment variables');
        }
        this.apiKey = process.env.YOUTUBE_API_KEY || '';
    }

    /**
     * Resolves a channel identifier (Handle string like "@user" or Channel ID like "UC...")
     * and returns the channel's designated "Uploads" playlist ID.
     */
    async getChannelUploadsPlaylistId(channelIdentifier: string): Promise<string | null> {
        try {
            let url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&key=${this.apiKey}`;

            // Basic parsing to distinguish ID vs Handle
            if (channelIdentifier.startsWith('@')) {
                url += `&forHandle=${encodeURIComponent(channelIdentifier)}`;
            } else if (channelIdentifier.startsWith('UC') && channelIdentifier.length === 24) {
                url += `&id=${encodeURIComponent(channelIdentifier)}`;
            } else {
                throw new BadRequestException('Invalid channel identifier (must be a @handle or a 24-char UC... ID)');
            }

            const res = await fetch(url);
            const data: any = await res.json();

            if (!data.items || data.items.length === 0) {
                return null;
            }

            const uploadsPlaylistId = data.items[0].contentDetails?.relatedPlaylists?.uploads;
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
                let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${encodeURIComponent(playlistId)}&maxResults=50&key=${this.apiKey}`;
                if (nextPageToken) {
                    url += `&pageToken=${encodeURIComponent(nextPageToken)}`;
                }

                const res = await fetch(url);
                const data: any = await res.json();

                if (data.items) {
                    for (const item of data.items) {
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

                nextPageToken = data.nextPageToken;
            } while (nextPageToken);

            return videos;
        } catch (error: any) {
            this.logger.error(`Error fetching playlist items for ${playlistId}: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to fetch videos from playlist: ${error.message}`);
        }
    }
}
