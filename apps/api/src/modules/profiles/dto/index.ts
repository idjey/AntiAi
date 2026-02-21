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
    IsNumber,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== PROFILE ====================

export class AppearanceDto {
    @IsOptional()
    @IsString()
    theme?: string;

    @IsOptional()
    @IsString()
    primary_color?: string;

    @IsOptional()
    @IsString()
    background_color?: string;

    @IsOptional()
    @IsString()
    icon_style?: string;

    @IsOptional()
    @IsString()
    avatar_aura?: string;

    @IsOptional()
    @IsString()
    logo_url?: string;

    @IsOptional()
    @IsString()
    logo_position?: string;

    @IsOptional()
    @IsNumber()
    logo_opacity?: number;

    @IsOptional()
    @IsNumber()
    logo_count?: number;

    @IsOptional()
    @IsNumber()
    logo_size?: number;

    @IsOptional()
    @IsString()
    scatter_style?: string;

    @IsOptional()
    @IsString()
    background_image?: string;

    // Public Page Background
    @IsOptional()
    @IsString()
    public_background_type?: 'color' | 'gradient' | 'image' | 'emoji';

    @IsOptional()
    @IsString()
    public_background_color?: string;

    @IsOptional()
    @IsString()
    public_background_gradient?: string;

    @IsOptional()
    @IsString()
    public_background_image?: string;

    @IsOptional()
    @IsString()
    public_background_emojis?: string;

    @IsOptional()
    @IsString()
    public_background_emoji_pattern?: string;

    @IsOptional()
    @IsString()
    public_background_emoji_direction?: string;

    @IsOptional()
    @IsNumber()
    public_background_overlay?: number;

    @IsOptional()
    @IsNumber()
    public_background_blur?: number;
    @IsOptional()
    @IsNumber()
    public_background_vignette?: number;

    @IsOptional()
    @IsNumber()
    public_background_grain?: number;

    @IsOptional()
    @IsString()
    public_card_theme?: 'light' | 'dark';

    @IsOptional()
    @IsString()
    card_style?: 'classic' | 'modern' | 'sharp' | 'pill';

    @IsOptional()
    @IsString()
    link_style?: 'list' | 'grid' | 'row';

    @IsOptional()
    @IsNumber()
    public_card_glow?: number;

    @IsOptional()
    @IsString()
    card_background_type?: 'color' | 'gradient' | 'image';

    @IsOptional()
    @IsString()
    card_background_gradient?: string;

    @IsOptional()
    @IsArray()
    sponsored_products?: any[];
}

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

    @IsOptional()
    @ValidateNested()
    @Type(() => AppearanceDto)
    appearance?: AppearanceDto;
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
    @IsString()
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

    @IsOptional()
    @ValidateNested()
    @Type(() => AppearanceDto)
    appearance?: AppearanceDto;
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

    @IsOptional()
    @IsString()
    custom_image_url?: string;
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
    @IsString()
    custom_image_url?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class ReorderLinksDto {
    @IsArray()
    @IsUUID('4', { each: true })
    link_ids: string[];
}
