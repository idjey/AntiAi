import { IsString, IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class IssueProofDto {
    @IsUUID()
    video_id: string;

    @IsDateString()
    expires_at: string;
}

export class ReissueProofDto {
    @IsUUID()
    video_id: string;

    @IsDateString()
    expires_at: string;

    @IsEnum(['extend_expiry', 'key_rotation', 'security_incident'])
    reason: 'extend_expiry' | 'key_rotation' | 'security_incident';

    @IsOptional()
    @IsString()
    note?: string;
}
