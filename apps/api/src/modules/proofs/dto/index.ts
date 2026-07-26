import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';

export class IssueProofDto {
    @IsUUID()
    video_id: string;

    @IsOptional()
    @IsString()
    content_hash?: string;

    @IsOptional()
    perceptual_hashes?: { fraction: number; hash: string; version: number }[];
}

export class ReissueProofDto {
    @IsUUID()
    video_id: string;

    @IsEnum(['extend_expiry', 'key_rotation', 'security_incident'])
    reason: 'extend_expiry' | 'key_rotation' | 'security_incident';

    @IsOptional()
    @IsString()
    note?: string;
}
