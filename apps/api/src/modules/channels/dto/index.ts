import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class VerifyStartDto {
    @IsString()
    youtube_channel_id: string;

    @IsEnum(['oauth', 'about_token', 'video_token', 'pinned_comment'])
    method: 'oauth' | 'about_token' | 'video_token' | 'pinned_comment';

    @IsOptional()
    @IsString()
    requested_handle?: string;
}

export class VerifyConfirmDto {
    @IsUUID()
    channel_id: string;
}
