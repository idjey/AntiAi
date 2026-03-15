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
    ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== NESTED APPEARANCE DTOs ====================

export class TabVisibilityDto {
    @IsOptional() @IsBoolean() links?: boolean;
    @IsOptional() @IsBoolean() shop?: boolean;
    @IsOptional() @IsBoolean() videos?: boolean;
    @IsOptional() @IsBoolean() music?: boolean;
    @IsOptional() @IsBoolean() events?: boolean;
}

export class PinnedItemsDto {
    @IsOptional() @IsString() links?: string;
    @IsOptional() @IsString() shop?: string;
    @IsOptional() @IsString() videos?: string;
    @IsOptional() @IsString() music?: string;
    @IsOptional() @IsString() events?: string;
}

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
    @IsString()
    layout?: string;

    @IsOptional()
    @IsString()
    avatar_shape?: string;

    @IsOptional()
    @IsString()
    banner_image_url?: string;

    @IsOptional()
    @IsString()
    font_pair?: string;

    @IsOptional()
    @IsString()
    heading_color?: string;

    @IsOptional()
    @IsString()
    body_color?: string;

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
    @IsNumber()
    card_bg_opacity?: number;

    @IsOptional()
    @IsNumber()
    card_backdrop_blur?: number;

    @IsOptional()
    @IsArray()
    sponsored_products?: any[];

    @IsOptional()
    @ValidateNested()
    @Type(() => TabVisibilityDto)
    tab_visibility?: TabVisibilityDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => PinnedItemsDto)
    pinned_items?: PinnedItemsDto;

    @IsOptional()
    @IsArray()
    music_links?: any[];

    @IsOptional()
    @IsArray()
    events?: any[];

    @IsOptional()
    @IsString()
    shop_layout?: 'list' | 'grid' | 'bento';

    // Border Settings
    @IsOptional()
    @IsString()
    card_border_style?: 'none' | 'solid' | 'dashed' | 'glow';

    @IsOptional()
    @IsString()
    card_border_color?: string;

    @IsOptional()
    @IsNumber()
    card_border_width?: number;

    @IsOptional()
    @IsBoolean()
    card_border_glow?: boolean;
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
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(3, { message: 'You can select a maximum of 3 categories' })
    categories?: string[];

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
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(3, { message: 'You can select a maximum of 3 categories' })
    categories?: string[];

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
