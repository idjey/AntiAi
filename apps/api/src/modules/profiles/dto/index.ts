import {
    IsString,
    IsOptional,
    IsUrl,
    IsUUID,
    IsBoolean,
    IsArray,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

// ==================== PROFILE ====================

export class CreateProfileDto {
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Handle can only contain letters, numbers, and underscores',
    })
    handle: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    display_name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @IsOptional()
    @IsUrl()
    avatar_url?: string;

    @IsOptional()
    @IsUrl()
    banner_url?: string;

    @IsOptional()
    @IsUUID()
    featured_video_id?: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Handle can only contain letters, numbers, and underscores',
    })
    handle?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    display_name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @IsOptional()
    @IsUrl()
    avatar_url?: string;

    @IsOptional()
    @IsUrl()
    banner_url?: string;

    @IsOptional()
    @IsUUID()
    featured_video_id?: string;

    @IsOptional()
    @IsBoolean()
    is_public?: boolean;
}

// ==================== LINKS ====================

export class CreateLinkDto {
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    label: string;

    @IsUrl()
    url: string;

    @IsOptional()
    @IsString()
    icon?: string;
}

export class UpdateLinkDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    label?: string;

    @IsOptional()
    @IsUrl()
    url?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class ReorderLinksDto {
    @IsArray()
    @IsUUID('4', { each: true })
    link_ids: string[];
}
