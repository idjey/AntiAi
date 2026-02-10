import { IsString, IsOptional, IsUUID } from 'class-validator';

export class ImportVideoDto {
    @IsString()
    video_url: string;

    @IsOptional()
    @IsUUID()
    channel_id?: string;

    @IsOptional()
    @IsString()
    title?: string;
}
