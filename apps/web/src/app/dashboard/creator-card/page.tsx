'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SocialIcon, getIconType } from '@/components/SocialIcon';
import { ImageUpload } from '@/components/ImageUpload';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// Helper for tooltips
const InfoTooltip = ({ content }: { content: string }) => (
    <div className="group relative inline-block ml-2 align-middle">
        <div className="w-4 h-4 rounded-full border border-text-muted/50 flex items-center justify-center text-[10px] text-text-muted cursor-help hover:border-primary hover:text-primary transition-colors">
            i
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-background border border-border shadow-2xl rounded-xl text-xs text-text-secondary opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-[100] font-normal normal-case tracking-normal">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-border" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-background mt-[-1px]" />
        </div>
    </div>
);

interface CreatorLink {
    id: string;
    label: string;
    url: string;
    icon: string;
    custom_image_url?: string;
    sort_order: number;
    is_active: boolean;
}

// Helper for brand gradients
const getBrandGradient = (icon: string) => {
    switch (icon) {
        case 'instagram': return 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';
        case 'youtube': return 'linear-gradient(45deg, #ff0000 0%, #cc0000 100%)';
        case 'twitter': return 'linear-gradient(45deg, #1da1f2 0%, #0d8bd9 100%)';
        case 'x': return 'linear-gradient(45deg, #000000 0%, #14171a 100%)';
        case 'tiktok': return 'linear-gradient(45deg, #000000 0%, #25f4ee 50%, #fe2c55 100%)';
        case 'linkedin': return 'linear-gradient(45deg, #0077b5 0%, #005582 100%)';
        case 'facebook': return 'linear-gradient(45deg, #1877f2 0%, #0c5dc7 100%)';
        case 'twitch': return 'linear-gradient(45deg, #9146ff 0%, #772ce8 100%)';
        case 'discord': return 'linear-gradient(45deg, #5865f2 0%, #404eed 100%)';
        case 'snapchat': return 'linear-gradient(45deg, #fffc00 0%, #e6e300 100%)';
        case 'whatsapp': return 'linear-gradient(45deg, #25d366 0%, #128c7e 100%)';
        case 'pinterest': return 'linear-gradient(45deg, #e60023 0%, #bd081c 100%)';
        case 'github': return 'linear-gradient(45deg, #24292e 0%, #000000 100%)';
        default: return `linear-gradient(135deg, #333 20%, #000 10%)`;
    }
};

interface Profile {
    id: string;
    plan?: string;
    verification_token?: string;
    handle: string;
    display_name: string;
    avatar_url: string;
    appearance?: {
        theme?: string;
        primary_color?: string;
        background_color?: string;
        icon_style?: 'monochrome' | 'color';
        avatar_aura?: 'none' | 'solid' | 'rainbow' | 'pulse';
        logo_url?: string;
        logo_position?: 'center_top' | 'top_left' | 'top_right' | 'center' | 'bottom_left' | 'bottom_right' | 'scatter';
        logo_opacity?: number;
        logo_size?: number;
        logo_count?: number;
        scatter_style?: 'random' | 'grid' | 'circle';
        background_image?: string;
        card_style?: 'classic' | 'modern' | 'sharp' | 'pill';
        // Public Page Background
        public_background_type?: 'color' | 'gradient' | 'image' | 'emoji';
        public_background_color?: string;
        public_background_gradient?: string;
        public_background_image?: string;
        public_background_emojis?: string;
        public_background_emoji_pattern?: 'scatter' | 'grid' | 'floating';
        public_background_emoji_direction?: 'up' | 'down' | 'left' | 'right';
        public_background_overlay?: number;
        public_background_blur?: number;
        public_background_vignette?: number;
        public_background_grain?: number;
        public_card_theme?: 'light' | 'dark';
        public_card_glow?: number;
        link_style?: 'list' | 'grid' | 'row';
        card_background_type?: 'color' | 'gradient' | 'image';
        card_background_gradient?: string;
        sponsored_products?: any[];
        card_border_style?: 'none' | 'solid' | 'dashed' | 'glow';
        card_border_color?: string;
        card_border_width?: number;
        card_border_glow?: boolean;
        tab_visibility?: { links: boolean; shop: boolean; videos: boolean; music: boolean; events: boolean };
        pinned_items?: { links: string; shop: string; videos: string; music: string; events: string };
        music_links?: any[];
        events?: any[];
    };
    featured_video?: {
        id: string;
        youtube_video_id: string;
        title: string;
        thumbnail_url: string;
        has_active_proof: boolean;
    } | null;
    verified_videos?: {
        id: string;
        youtube_video_id: string;
        title: string;
        thumbnail_url: string;
        proof_id: string;
        published_at: string;
    }[];
}

// ======= ONE-CLICK ARTIST THEMES (PREMIUM) =======
const PRESET_THEMES = [
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        colors: ['#0f172a', '#3b82f6', '#ec4899', '#8b5cf6'],
        appearance: {
            theme: 'modern_dark',
            primary_color: '#00ffcc',
            background_color: '#000000',
            public_background_type: 'image',
            public_background_image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop',
            public_background_overlay: 60,
            public_background_blur: 5,
            card_background_type: 'color',
            card_bg_opacity: 20,
            card_backdrop_blur: 24,
            card_border_style: 'glow',
            card_border_color: '#ec4899',
            card_border_glow: true,
            card_style: 'sharp',
            link_style: 'grid',
            icon_style: 'colorful',
            avatar_aura: 'pulse'
        }
    },
    {
        id: 'frosted_glass',
        name: 'Frosted Glass',
        colors: ['#e2e8f0', '#94a3b8', '#ffffff'],
        appearance: {
            theme: 'modern_light',
            primary_color: '#ffffff',
            background_color: '#ffffff',
            public_background_type: 'gradient',
            public_background_gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            public_background_overlay: 0,
            public_background_blur: 0,
            card_background_type: 'color',
            card_bg_opacity: 15,
            card_backdrop_blur: 35,
            card_border_style: 'solid',
            card_border_color: '#ffffff',
            card_border_glow: false,
            card_style: 'modern',
            link_style: 'list',
            icon_style: 'monochrome',
            avatar_aura: 'solid'
        }
    },
    {
        id: 'midnight_gold',
        name: 'Midnight Gold',
        colors: ['#000000', '#1a1a1a', '#fbbf24'],
        appearance: {
            theme: 'modern_dark',
            primary_color: '#fbbf24',
            background_color: '#050505',
            public_background_type: 'image',
            public_background_image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
            public_background_overlay: 80,
            public_background_blur: 2,
            card_background_type: 'gradient',
            card_background_gradient: 'linear-gradient(to bottom, #111111, #000000)',
            card_bg_opacity: 90,
            card_backdrop_blur: 10,
            card_border_style: 'solid',
            card_border_color: '#fbbf24',
            card_border_glow: true,
            card_style: 'classic',
            link_style: 'list',
            icon_style: 'colorful',
            avatar_aura: 'none'
        }
    },
    {
        id: 'sakura',
        name: 'Sakura Pink',
        colors: ['#fdf2f8', '#fce7f3', '#db2777'],
        appearance: {
            theme: 'modern_light',
            primary_color: '#db2777',
            background_color: '#fff1f2',
            public_background_type: 'image',
            public_background_image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2076&auto=format&fit=crop',
            public_background_overlay: 20,
            public_background_blur: 10,
            card_background_type: 'color',
            card_bg_opacity: 40,
            card_backdrop_blur: 20,
            card_border_style: 'solid',
            card_border_color: '#fbcfe8',
            card_border_glow: false,
            card_style: 'pill',
            link_style: 'row',
            icon_style: 'monochrome',
            avatar_aura: 'rainbow'
        }
    },
    {
        id: 'monochrome',
        name: 'Pure Mono',
        colors: ['#ffffff', '#888888', '#000000'],
        appearance: {
            theme: 'modern_dark',
            primary_color: '#ffffff',
            background_color: '#000000',
            public_background_type: 'color',
            public_background_color: '#0a0a0a',
            public_background_overlay: 0,
            public_background_blur: 0,
            card_background_type: 'color',
            card_bg_opacity: 100,
            card_backdrop_blur: 0,
            card_border_style: 'none',
            card_border_glow: false,
            card_style: 'sharp',
            link_style: 'list',
            icon_style: 'monochrome',
            avatar_aura: 'none'
        }
    },
    {
        id: 'emerald_forest',
        name: 'Emerald Forest',
        colors: ['#064e3b', '#10b981', '#a7f3d0'],
        appearance: {
            theme: 'modern_dark',
            primary_color: '#10b981',
            background_color: '#022c22',
            public_background_type: 'image',
            public_background_image: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2064&auto=format&fit=crop',
            public_background_overlay: 50,
            public_background_blur: 4,
            card_background_type: 'color',
            card_bg_opacity: 30,
            card_backdrop_blur: 16,
            card_border_style: 'solid',
            card_border_color: '#10b981',
            card_border_glow: true,
            card_style: 'modern',
            link_style: 'grid',
            icon_style: 'colorful',
            avatar_aura: 'pulse'
        }
    },
    {
        id: 'neon_sunset',
        name: 'Neon Sunset',
        colors: ['#4c1d95', '#db2777', '#f97316'],
        appearance: {
            theme: 'modern_dark',
            primary_color: '#f97316',
            background_color: '#2e1065',
            public_background_type: 'image',
            public_background_image: 'https://images.unsplash.com/photo-1555448248-2571daf6344b?q=80&w=2070&auto=format&fit=crop',
            public_background_overlay: 30,
            public_background_blur: 8,
            card_background_type: 'gradient',
            card_background_gradient: 'linear-gradient(135deg, rgba(76,29,149,0.5) 0%, rgba(219,39,119,0.5) 100%)',
            card_bg_opacity: 40,
            card_backdrop_blur: 30,
            card_border_style: 'glow',
            card_border_color: '#f97316',
            card_border_glow: true,
            card_style: 'pill',
            link_style: 'row',
            icon_style: 'colorful',
            avatar_aura: 'solid'
        }
    },
    {
        id: 'deep_ocean',
        name: 'Deep Ocean',
        colors: ['#082f49', '#0284c7', '#38bdf8', '#7dd3fc'],
        appearance: {
            theme: 'modern_dark',
            primary_color: '#38bdf8',
            background_color: '#082f49',
            public_background_type: 'image',
            public_background_image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2070&auto=format&fit=crop',
            public_background_overlay: 70,
            public_background_blur: 15,
            card_background_type: 'color',
            card_bg_opacity: 10,
            card_backdrop_blur: 40,
            card_border_style: 'dashed',
            card_border_color: '#38bdf8',
            card_border_glow: false,
            card_style: 'sharp',
            link_style: 'list',
            icon_style: 'monochrome',
            avatar_aura: 'pulse'
        }
    },
    {
        id: 'crimson_shadow',
        name: 'Crimson Shadow',
        colors: ['#450a0a', '#991b1b', '#ef4444', '#fca5a5'],
        appearance: {
            theme: 'modern_dark',
            primary_color: '#ef4444',
            background_color: '#000000',
            public_background_type: 'gradient',
            public_background_gradient: 'radial-gradient(circle at center, #450a0a 0%, #000000 100%)',
            public_background_overlay: 0,
            public_background_blur: 0,
            card_background_type: 'color',
            card_bg_opacity: 90,
            card_backdrop_blur: 5,
            card_border_style: 'solid',
            card_border_color: '#ef4444',
            card_border_glow: true,
            card_style: 'classic',
            link_style: 'grid',
            icon_style: 'colorful',
            avatar_aura: 'none'
        }
    }
];

// ======= CURATED FONT PAIRS (PRO/ELITE) =======
const FONT_PAIRS = [
    { id: 'clean', name: 'Clean', heading: 'Inter', body: 'Inter', category: 'Modern' },
    { id: 'editorial', name: 'Editorial', heading: 'Playfair Display', body: 'Source Sans 3', category: 'Classic' },
    { id: 'tech', name: 'Tech', heading: 'Space Grotesk', body: 'IBM Plex Sans', category: 'Modern' },
    { id: 'bold', name: 'Bold', heading: 'Oswald', body: 'Nunito', category: 'Modern' },
    { id: 'elegant', name: 'Elegant', heading: 'Cormorant Garamond', body: 'Lato', category: 'Classic' },
    { id: 'playful', name: 'Playful', heading: 'Fredoka', body: 'Quicksand', category: 'Creative' },
    { id: 'mono', name: 'Mono', heading: 'Space Mono', body: 'JetBrains Mono', category: 'Modern' },
    { id: 'retro', name: 'Retro', heading: 'Righteous', body: 'Poppins', category: 'Creative' },
    { id: 'art_deco', name: 'Art Deco', heading: 'Poiret One', body: 'Raleway', category: 'Classic' },
    { id: 'handwritten', name: 'Handwritten', heading: 'Caveat', body: 'Nunito', category: 'Creative' },
    { id: 'neon', name: 'Neon', heading: 'Orbitron', body: 'Exo 2', category: 'Futuristic' },
    { id: 'minimal', name: 'Minimal', heading: 'Outfit', body: 'Work Sans', category: 'Modern' },
    { id: 'luxury', name: 'Luxury', heading: 'Cinzel', body: 'EB Garamond', category: 'Classic' },
    { id: 'urban', name: 'Urban', heading: 'Archivo Black', body: 'DM Sans', category: 'Modern' },
    { id: 'whimsy', name: 'Whimsy', heading: 'Pacifico', body: 'Outfit', category: 'Creative' },
    { id: 'gothic', name: 'Gothic', heading: 'UnifrakturCook', body: 'Lora', category: 'Classic' },
    { id: 'futuristic', name: 'Futuristic', heading: 'Rajdhani', body: 'Exo 2', category: 'Futuristic' },
    { id: 'warm', name: 'Warm', heading: 'Merriweather', body: 'Source Sans 3', category: 'Classic' },
    { id: 'impact', name: 'Impact', heading: 'Anton', body: 'Roboto', category: 'Modern' },
    { id: 'classic', name: 'Classic', heading: 'Libre Baskerville', body: 'Karla', category: 'Classic' },
];

// ======= CURATED COLOR PALETTES (for "Feeling Lucky") =======
const COLOR_PALETTES = [
    { name: 'Sunset', heading: '#FF6B6B', body: '#A0937D' },
    { name: 'Arctic', heading: '#B8E4F0', body: '#C5C6D0' },
    { name: 'Noir', heading: '#FFFFFF', body: '#B0B0B0' },
    { name: 'Emerald', heading: '#2ECC71', body: '#7FB285' },
    { name: 'Royalty', heading: '#FFD700', body: '#C0C0C0' },
    { name: 'Lavender Dream', heading: '#B388FF', body: '#D1C4E9' },
    { name: 'Coral Reef', heading: '#FF7043', body: '#FFAB91' },
    { name: 'Midnight Blue', heading: '#82B1FF', body: '#90CAF9' },
    { name: 'Rose Gold', heading: '#F48FB1', body: '#E0BEC7' },
    { name: 'Citrus', heading: '#FFD54F', body: '#E6C068' },
    { name: 'Electric', heading: '#00E5FF', body: '#B2EBF2' },
    { name: 'Cherry Blossom', heading: '#F06292', body: '#F8BBD0' },
    { name: 'Terminal', heading: '#00FF41', body: '#76FF03' },
    { name: 'Slate', heading: '#CFD8DC', body: '#90A4AE' },
    { name: 'Candy', heading: '#EA80FC', body: '#FF80AB' },
];

// ======= CREATOR CARD LAYOUTS =======
const LAYOUTS = [
    { id: 'classic', name: 'Classic', description: 'Standard centered layout', tier: 'free' },
    { id: 'showcase', name: 'Showcase', description: 'Modern split layout', tier: 'pro' },
    { id: 'hero', name: 'Hero Cover', description: 'Premium banner layout', tier: 'elite' },
];

// ======= AVATAR SHAPES =======
const SHAPES = [
    { id: 'circle', name: 'Circle', tier: 'free' },
    { id: 'squircle', name: 'Squircle', tier: 'pro' },
    { id: 'hexagon', name: 'Hexagon', tier: 'pro' },
    { id: 'archway', name: 'Archway', tier: 'elite' },
    { id: 'starburst', name: 'Starburst', tier: 'elite' },
];

const ALL_FONTS_LIST = Array.from(new Set(FONT_PAIRS.flatMap(fp => [fp.heading, fp.body])));
const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${ALL_FONTS_LIST.map(f => `family=${f.replace(/ /g, '+')}:wght@400;700`).join('&')}&display=swap`;

export default function CreatorCardPage() {
    const [links, setLinks] = useState<CreatorLink[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifyingLogo, setIsVerifyingLogo] = useState(false);
    const [logoUrlError, setLogoUrlError] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingLogoFile, setIsUploadingLogoFile] = useState(false);

    // Layout State
    const [previewOpen, setPreviewOpen] = useState(true);

    // Filter/Tab State
    const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'shop' | 'music' | 'events'>('links');
    const [isTokenRevealed, setIsTokenRevealed] = useState(false);

    // Feature Toggles and Pinning
    const [tabVisibility, setTabVisibility] = useState({
        links: true,
        shop: true,
        music: true,
        events: true
    });

    const [pinnedItems, setPinnedItems] = useState<{
        links: string | null;
        shop: string | null;
        music: string | null;
        events: string | null;
    }>({
        links: null,
        shop: null,
        music: null,
        events: null
    });

    // Sponsored Products State
    interface SponsoredProduct {
        id: string;
        url: string;
        title: string;
        description: string | null;
        image: string | null;
        site_name: string | null;
        added_at: string;
        is_active?: boolean;
    }
    const [products, setProducts] = useState<SponsoredProduct[]>([]);
    const [productUrl, setProductUrl] = useState('');
    const [isFetchingMeta, setIsFetchingMeta] = useState(false);
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [productMeta, setProductMeta] = useState<{
        title: string;
        description: string;
        image: string;
        site_name: string;
        is_active?: boolean;
    } | null>(null);
    const [productLimitError, setProductLimitError] = useState<string | null>(null);
    const [planInfo, setPlanInfo] = useState<{ plan: string; cap: number } | null>(null);

    // Music State
    interface MusicLink {
        id: string;
        url: string;
        title: string;
        platform: string;
        added_at: string;
        is_active?: boolean;
    }
    const [musicLinks, setMusicLinks] = useState<MusicLink[]>([]);
    const [musicUrl, setMusicUrl] = useState('');
    const [musicTitle, setMusicTitle] = useState('');
    const [editingMusicId, setEditingMusicId] = useState<string | null>(null);
    const [isSavingMusic, setIsSavingMusic] = useState(false);

    // Events State
    interface EventItem {
        id: string;
        title: string;
        date: string;
        venue: string;
        ticket_url: string;
        added_at: string;
        is_active?: boolean;
    }
    const [events, setEvents] = useState<EventItem[]>([]);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventVenue, setEventVenue] = useState('');
    const [eventUrl, setEventUrl] = useState('');
    const [isSavingEvent, setIsSavingEvent] = useState(false);

    const isPro = profile?.plan === 'pro' || profile?.plan === 'elite';

    // Helper function to convert Hex + Opacity into rgba
    const hexToRgba = (hex: string, opacityPercent: number) => {
        if (!hex) return `rgba(0,0,0,${opacityPercent / 100})`;
        const cleanHex = hex.replace('#', '');
        if (cleanHex.length !== 6) return `rgba(0,0,0,${opacityPercent / 100})`;
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 2), 16);
        const b = parseInt(cleanHex.substring(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacityPercent / 100})`;
    };

    // Track Premium user status
    const [isPremium, setIsPremium] = useState(false);
    const [appearance, setAppearance] = useState({
        theme: 'modern_dark',
        primary_color: '#10b981',
        background_color: '#000000',
        icon_style: 'monochrome' as 'monochrome' | 'color',
        avatar_aura: 'none' as 'none' | 'solid' | 'rainbow' | 'pulse',
        logo_url: '',
        logo_position: 'center_top' as 'center_top' | 'top_left' | 'top_right' | 'center' | 'bottom_left' | 'bottom_right' | 'scatter',
        logo_opacity: 0.2,
        logo_size: 32,
        logo_count: 12,
        scatter_style: 'random' as 'random' | 'grid' | 'circle',
        background_image: '',
        card_style: 'modern' as 'classic' | 'modern' | 'sharp' | 'pill',
        link_style: 'list' as 'list' | 'grid' | 'row',
        shop_layout: 'list' as 'list' | 'grid' | 'bento',
        // Public Page Defaults
        public_background_type: 'color' as 'color' | 'gradient' | 'image' | 'emoji',
        public_background_color: '#000000',
        public_background_gradient: 'linear-gradient(to bottom right, #000000, #1a1a1a)',
        public_background_image: '',
        public_background_emojis: '',
        public_background_emoji_pattern: 'scatter' as 'scatter' | 'grid' | 'floating',
        public_background_emoji_direction: 'up' as 'up' | 'down' | 'left' | 'right',
        public_background_overlay: 40,
        public_background_blur: 0,
        public_background_vignette: 0,
        public_background_grain: 0,
        public_card_theme: 'dark' as 'light' | 'dark',
        public_card_glow: 0,
        card_background_type: 'color' as 'color' | 'gradient' | 'image',
        card_background_gradient: '',
        card_bg_opacity: 100,
        card_backdrop_blur: 0,
        card_border_style: 'none' as 'none' | 'solid' | 'dashed' | 'glow',
        card_border_color: '',
        card_border_width: 1,
        card_border_glow: false,
        tab_visibility: { links: true, shop: true, videos: true, music: true, events: true },
        pinned_items: { links: '', shop: '', videos: '', music: '', events: '' },
        // Typography (Pro/Elite)
        font_pair: 'clean',
        heading_color: '',
        body_color: '',
        // Layouts & Shapes
        layout: 'classic',
        avatar_shape: 'circle',
        banner_image_url: '',
    });

    // Scatter Pattern State
    const [scatterPositions, setScatterPositions] = useState<Array<{ top: number, left: number, rotate: number }>>([]);

    const generateScatterPositions = (count: number, style: string) => {
        let newPositions: Array<{ top: number, left: number, rotate: number }> = [];

        if (style === 'grid') {
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            for (let i = 0; i < count; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                newPositions.push({
                    top: (row / rows) * 100 + (100 / rows / 2),
                    left: (col / cols) * 100 + (100 / cols / 2),
                    rotate: 0
                });
            }
        } else if (style === 'circle') {
            const radius = 35; // %
            const centerX = 50;
            const centerY = 50;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * 2 * Math.PI;
                newPositions.push({
                    top: centerY + radius * Math.sin(angle),
                    left: centerX + radius * Math.cos(angle),
                    rotate: (angle * 180 / Math.PI) + 90
                });
            }
        } else {
            // Random
            newPositions = Array(count).fill(0).map(() => ({
                top: Math.random() * 90 + 5,
                left: Math.random() * 90 + 5,
                rotate: Math.random() * 360
            }));
        }
        setScatterPositions(newPositions);
    };

    // Update positions when appearance settings change
    useEffect(() => {
        if (appearance.logo_position === 'scatter') {
            generateScatterPositions(appearance.logo_count || 12, appearance.scatter_style || 'random');
        }
    }, [appearance.logo_count, appearance.scatter_style, appearance.logo_position]);

    // Form State (Links)
    const [showForm, setShowForm] = useState(false);
    const [editingLink, setEditingLink] = useState<CreatorLink | null>(null);
    const [formData, setFormData] = useState({ label: '', url: '', icon: '', custom_image_url: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Fetch Profile
            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data.profile);
                // Initialize appearance from profile
                if (data.profile.appearance) {
                    setAppearance(prev => ({
                        ...prev,
                        ...data.profile.appearance,
                        tab_visibility: data.profile.appearance.tab_visibility || { links: true, shop: true, videos: true, music: true, events: true },
                        pinned_items: data.profile.appearance.pinned_items || { links: '', shop: '', videos: '', music: '', events: '' }
                    }));
                }
                // Load premium data from appearance
                const prods = data.profile.appearance?.sponsored_products || [];
                setProducts(prods);
                const music = data.profile.appearance?.music_links || [];
                setMusicLinks(music);
                const evts = data.profile.appearance?.events || [];
                setEvents(evts);
            }

            // Fetch Links
            const linksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/links`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (linksRes.ok) {
                const data = await linksRes.json();
                setLinks(data.items);
            }
        } catch (err) {
            console.error('Failed to fetch creator card data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        const icon = getIconType(url);
        setFormData(prev => ({ ...prev, url, icon }));
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const token = localStorage.getItem('token');
            const url = editingLink
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/links/${editingLink.id}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/links`;

            const method = editingLink ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchData(); // Refresh list
                setShowForm(false);
                setEditingLink(null);
                setFormData({ label: '', url: '', icon: '', custom_image_url: '' });
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to save link');
            }
        } catch (err) {
            console.error('Failed to save link', err);
            alert('An error occurred while saving the link');
        } finally {
            setIsSaving(false);
        }
    };

    const [isSuccess, setIsSuccess] = useState(false);

    // Reset success state when changes are made
    useEffect(() => {
        if (isSuccess) setIsSuccess(false);
    }, [appearance, profile?.avatar_url]);

    const handleAppearanceSave = async (overrides?: any) => {
        setIsSaving(true);
        setIsSuccess(false);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appearance: {
                        ...appearance,
                        sponsored_products: products,
                        music_links: musicLinks,
                        events: events,
                        ...(overrides || {})
                    },
                    avatar_url: profile?.avatar_url
                })
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                setIsSuccess(true);
                setTimeout(() => setIsSuccess(false), 3000);
            } else {
                console.error('Save failed:', res.statusText);
            }
        } catch (err) {
            console.error('Failed to save appearance', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/links/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setLinks(links.filter(l => l.id !== id));
        } catch (err) {
            console.error('Failed to delete link', err);
        }
    };

    const openEdit = (link: CreatorLink) => {
        setEditingLink(link);
        setFormData({
            label: link.label,
            url: link.url,
            icon: link.icon || getIconType(link.url),
            custom_image_url: link.custom_image_url || ''
        });
        setShowForm(true);
    };

    const copyLink = () => {
        if (!profile) return;
        const url = `${window.location.origin}/${profile.handle}`;
        navigator.clipboard.writeText(url);
        alert('Copied to clipboard!');
    };

    if (isLoading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    if (!profile) {
        return (
            <div className="max-w-[800px] mx-auto py-24 px-6 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                    <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-4">Set up your profile</h1>
                <p className="text-text-secondary mb-10 leading-relaxed max-w-md mx-auto text-lg">Claim a unique handle before you configure your Creator Card. This will be your public URL.</p>

                <div className="max-w-md mx-auto p-8 bg-surface-light border border-white/5 rounded-2xl shadow-xl">
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSaving(true);
                        try {
                            const input = document.getElementById('setup-handle') as HTMLInputElement;
                            const handleVal = input.value.toLowerCase().trim();
                            const token = localStorage.getItem('token');

                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ handle: handleVal })
                            });

                            if (res.ok) {
                                await fetchData();
                            } else {
                                const data = await res.json();
                                alert(data.message || 'Failed to claim handle');
                            }
                        } catch (err) {
                            alert('An error occurred');
                        } finally {
                            setIsSaving(false);
                        }
                    }}>
                        <div className="mb-6 relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium transition-colors group-focus-within:text-primsry text-lg tracking-wide">antiai.me/</span>
                            <input
                                id="setup-handle"
                                type="text"
                                required
                                minLength={3}
                                maxLength={30}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-[110px] pr-4 py-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-bold text-lg"
                                placeholder="your-handle"
                                disabled={isSaving}
                            />
                        </div>
                        <button type="submit" disabled={isSaving} className="w-full btn-primary py-4 font-bold text-base shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all">
                            {isSaving ? 'Claiming Handle...' : 'Claim Handle'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const NEXT_PUBLIC_FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL && process.env.NEXT_PUBLIC_FRONTEND_URL !== '' ? process.env.NEXT_PUBLIC_FRONTEND_URL : (typeof window !== 'undefined' ? window.location.origin : '');
    const publicUrl = profile ? `${NEXT_PUBLIC_FRONTEND_URL}/${profile.handle}` : '';

    const handleRandomize = () => {
        const themes = ['modern_dark', 'holographic', 'minimal'];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        const generateRandomColor = () => {
            return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        };

        const randomPrimary = generateRandomColor();
        const randomBackground = generateRandomColor();

        const iconStyles = ['monochrome', 'color'];
        const randomIconStyle = iconStyles[Math.floor(Math.random() * iconStyles.length)];

        setAppearance(prev => ({
            ...prev,
            theme: randomTheme,
            primary_color: randomPrimary,
            background_color: randomBackground,
            icon_style: randomIconStyle as any
        }));
    };

    // Card Shape Logic for Preview
    const cardStyle = appearance.card_style || 'modern';
    const shapeClasses = {
        classic: { card: 'rounded-xl', link: 'rounded-lg' },
        modern: { card: 'rounded-[2.5rem]', link: 'rounded-2xl' },
        sharp: { card: 'rounded-none', link: 'rounded-none' },
        pill: { card: 'rounded-[3rem]', link: 'rounded-full' }
    };
    const currentShape = shapeClasses[cardStyle as keyof typeof shapeClasses] || shapeClasses.modern;

    // Helper for contrast text color
    const getContrastYIQ = (hexcolor: string) => {
        if (!hexcolor) return '#ffffff';
        const r = parseInt(hexcolor.substring(1, 3), 16);
        const g = parseInt(hexcolor.substring(3, 5), 16);
        const b = parseInt(hexcolor.substring(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    };

    const isLightMode = appearance.public_card_theme === 'light';
    const cardBgColor = appearance.background_color || '#000000';
    const dynamicTextColor = appearance.card_background_type === 'color' ? getContrastYIQ(cardBgColor) : isLightMode ? '#000000' : '#ffffff';
    const cardBgOpacity = appearance.card_bg_opacity !== undefined ? appearance.card_bg_opacity : 100;
    const cardBackdropBlur = appearance.card_backdrop_blur || 0;
    const cardGlow = appearance.public_card_glow || 0;

    const previewFontPairId = appearance.font_pair || 'clean';
    const previewFontPair = FONT_PAIRS.find(fp => fp.name.toLowerCase() === previewFontPairId.toLowerCase()) || FONT_PAIRS[0];
    const previewHeadingFont = previewFontPair.heading;
    const previewBodyFont = previewFontPair.body;
    const customHeadingColor = appearance.heading_color || '';
    const customBodyColor = appearance.body_color || '';


    return (
        <>
        {/* Inject dynamic fonts for the preview */}
        <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
        <div className="max-w-[2000px] mx-auto h-[calc(100vh-100px)] flex gap-8 px-6">
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-8 border-r border-border scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Creator Card</h1>
                        <p className="text-text-secondary">Manage your links and public profile</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Toggle Preview Page */}
                        <button
                            onClick={() => setPreviewOpen(!previewOpen)}
                            className="btn-secondary flex items-center gap-2"
                            title={previewOpen ? 'Hide Preview' : 'Show Preview'}
                        >
                            {previewOpen ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    <span className="hidden sm:inline">Hide Preview</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    <span className="hidden sm:inline">Show Preview</span>
                                </>
                            )}
                        </button>

                        {/* View Public Page */}
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            <span className="hidden sm:inline">View Public Page</span>
                        </a>

                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-border overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'links', label: 'Links' },
                        { id: 'shop', label: 'Shop', count: products.length },
                        { id: 'music', label: 'Music', count: musicLinks.length },
                        { id: 'events', label: 'Events', count: events.length },
                        { id: 'appearance', label: 'Appearance' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="ml-1.5 text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5">{tab.count}</span>
                            )}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                        </button>
                    ))}
                </div>

                {activeTab === 'links' ? (
                    <div className="space-y-6">
                        {/* Add New Link Card */}
                        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">✦ Add New Link</h2>
                            {showForm ? (
                                <form onSubmit={handleLinkSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Link Label</label>
                                        <input
                                            type="text"
                                            value={formData.label}
                                            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50"
                                            placeholder="e.g. My Website"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">URL</label>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                value={formData.url}
                                                onChange={handleUrlChange}
                                                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50"
                                                placeholder="https://..."
                                                required
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                                                <SocialIcon type={formData.icon || 'link'} className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Grid Image */}
                                    <div className="col-span-full pt-4 border-t border-border mt-4">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            Custom Grid Image <span className="text-xs text-text-muted">(Optional)</span>
                                        </label>
                                        <p className="text-xs text-text-secondary mb-2">Upload a background image for this link when displayed in Grid mode.</p>
                                        <div className="flex items-center gap-4">
                                            {Boolean(formData.custom_image_url) ? (
                                                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                                                    <img src={formData.custom_image_url} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, custom_image_url: '' }))}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <ImageUpload
                                                    onUpload={(url) => setFormData(prev => ({ ...prev, custom_image_url: url }))}
                                                    className="w-full"
                                                >
                                                    <div className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer bg-surface-light/50">
                                                        <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        <span className="text-xs font-medium">Upload Image</span>
                                                    </div>
                                                </ImageUpload>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowForm(false); setEditingLink(null); }}
                                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? 'Saving...' : (editingLink ? 'Update Link' : 'Add Link')}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="w-full py-3 border-2 border-dashed border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </span>
                                    <span className="font-medium">Add New Link</span>
                                </button>
                            )}
                        </div>

                        {/* Links List */}
                        <div className="space-y-3">
                            {links.map((link) => (
                                <div key={link.id} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 group hover:border-border-hover transition-colors">
                                    <div className="cursor-move text-text-muted hover:text-text-secondary">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-text-primary">
                                        <SocialIcon type={link.icon} className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-text-primary truncate">{link.label}</h3>
                                        <p className="text-xs text-text-secondary truncate">{link.url}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(link)} className="p-2 text-text-secondary hover:text-primary transition-colors" title="Edit">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(link.id)} className="p-2 text-text-secondary hover:text-red-500 transition-colors" title="Delete">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {links.length === 0 && !showForm && (
                                <div className="text-center py-12 text-text-secondary">
                                    <p>No links yet. Add your first link above!</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'shop' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Add Product Card */}
                        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">🛍️ Add Sponsored Product</h2>
                                <span className="text-xs text-text-muted">{products.length} / {planInfo?.cap ?? '?'} products</span>
                            </div>

                            {/* URL + Fetch */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary">Product URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={productUrl}
                                        onChange={e => { setProductUrl(e.target.value); setProductMeta(null); setProductLimitError(null); }}
                                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50 text-sm"
                                        placeholder="https://amazon.com/..."
                                    />
                                    <button
                                        type="button"
                                        disabled={!productUrl || isFetchingMeta}
                                        onClick={async () => {
                                            if (!productUrl) return;
                                            setIsFetchingMeta(true);
                                            setProductMeta(null);
                                            setEditingProductId(null);
                                            try {
                                                const token = localStorage.getItem('token');
                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/products/fetch-meta`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                    body: JSON.stringify({ url: productUrl })
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setProductMeta({ title: data.title || '', description: data.description || '', image: data.image || '', site_name: data.site_name || '' });
                                                }
                                            } catch (e) {
                                                setProductMeta({ title: '', description: '', image: '', site_name: '' });
                                            } finally {
                                                setIsFetchingMeta(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-primary text-black text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {isFetchingMeta ? 'Fetching...' : 'Fetch Info'}
                                    </button>
                                </div>
                                <p className="text-xs text-text-muted">Paste any product URL. We'll try to auto-fetch the title and image. Fill in manually if it doesn't work.</p>
                            </div>

                            {/* Manual / Preview Fields */}
                            {productMeta !== null && (
                                <div className="space-y-3 pt-3 border-t border-border animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-4">
                                        {/* Image preview with upload wrapper */}
                                        <ImageUpload
                                            onUpload={(url) => setProductMeta(p => p ? { ...p, image: url } : p)}
                                            className="w-24 h-24 rounded-lg border border-border overflow-hidden bg-surface-light flex-shrink-0 cursor-pointer group relative"
                                        >
                                            {productMeta.image ? (
                                                <>
                                                    <img src={productMeta.image} alt="Preview" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = ''; }} />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs z-10">
                                                        Change
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-text-muted text-xs text-center p-2 hover:text-primary transition-colors">
                                                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    Upload
                                                </div>
                                            )}
                                        </ImageUpload>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={productMeta.title}
                                                onChange={e => setProductMeta(p => p ? { ...p, title: e.target.value } : p)}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-text-primary focus:outline-none focus:border-primary text-sm"
                                                placeholder="Product title"
                                            />
                                            <input
                                                type="text"
                                                value={productMeta.site_name}
                                                onChange={e => setProductMeta(p => p ? { ...p, site_name: e.target.value } : p)}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-text-secondary focus:outline-none focus:border-primary text-xs"
                                                placeholder="Site name (e.g. Amazon)"
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        value={productMeta.description}
                                        onChange={e => setProductMeta(p => p ? { ...p, description: e.target.value } : p)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-secondary focus:outline-none focus:border-primary text-xs resize-none"
                                        rows={2}
                                        placeholder="Short description (optional)"
                                    />
                                    <input
                                        type="url"
                                        value={productMeta.image}
                                        onChange={e => setProductMeta(p => p ? { ...p, image: e.target.value } : p)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-text-muted focus:outline-none focus:border-primary text-xs"
                                        placeholder="Image URL (override or paste manually)"
                                    />

                                    {/* Tier limit error */}
                                    {productLimitError && (
                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400">
                                            {productLimitError}
                                            <a href="/dashboard/billing" className="ml-2 underline font-semibold">Upgrade →</a>
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            disabled={!productMeta.title || isSavingProduct}
                                            onClick={async () => {
                                                if (!productMeta?.title) return;
                                                setIsSavingProduct(true);
                                                setProductLimitError(null);
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const url = editingProductId
                                                        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/products/${editingProductId}`
                                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/products`;

                                                    const res = await fetch(url, {
                                                        method: editingProductId ? 'PUT' : 'POST',
                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                        body: JSON.stringify({ url: productUrl, ...productMeta })
                                                    });
                                                    const data = await res.json();
                                                    if (res.ok) {
                                                        if (editingProductId) {
                                                            setProducts(prev => prev.map(p => p.id === editingProductId ? data.product : p));
                                                        } else {
                                                            setProducts(prev => [...prev, data.product]);
                                                            setPlanInfo({ plan: '', cap: data.cap });
                                                        }
                                                        setProductMeta(null);
                                                        setProductUrl('');
                                                        setEditingProductId(null);
                                                    } else if (data.upgrade_required) {
                                                        setProductLimitError(data.message);
                                                    } else {
                                                        alert(data.message || 'Failed to save product');
                                                    }
                                                } catch (e) {
                                                    alert('Failed to save product');
                                                } finally {
                                                    setIsSavingProduct(false);
                                                }
                                            }}
                                            className="px-6 py-2 bg-primary text-black text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                        >
                                            {isSavingProduct ? 'Saving...' : 'Save Product'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Saved Products List */}
                        {products.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Saved Products</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {products.map(product => (
                                        <div key={product.id} className={`bg-surface border border-border rounded-xl overflow-hidden flex gap-3 p-3 group transition-opacity ${product.is_active === false ? 'opacity-50 hover:opacity-75 grayscale-[0.5]' : ''}`}>
                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-light flex-shrink-0">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm font-medium truncate ${product.is_active === false ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{product.title}</p>
                                                    {product.is_active === false && <span className="text-[10px] bg-surface-light text-text-muted px-1.5 py-0.5 rounded border border-border">Hidden</span>}
                                                </div>
                                                {product.site_name && <p className="text-xs text-text-muted">{product.site_name}</p>}
                                                <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-full">{product.url}</a>
                                            </div>
                                            <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 items-center justify-center">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={async () => {
                                                            const token = localStorage.getItem('token');
                                                            const newIsActive = product.is_active === false ? true : false;
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/products/${product.id}`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                body: JSON.stringify({ is_active: newIsActive })
                                                            });
                                                            if (res.ok) {
                                                                const data = await res.json();
                                                                setProducts(prev => prev.map(p => p.id === product.id ? data.product : p));
                                                            }
                                                        }}
                                                        className={`p-1.5 transition-colors rounded ${product.is_active !== false ? 'text-text-muted hover:text-amber-500 hover:bg-amber-500/10' : 'text-text-muted hover:text-green-500 hover:bg-green-500/10'}`}
                                                        title={product.is_active !== false ? "Hide on profile" : "Show on profile"}
                                                    >
                                                        {product.is_active !== false ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingProductId(product.id);
                                                            setProductUrl(product.url);
                                                            setProductMeta({
                                                                title: product.title,
                                                                description: product.description || '',
                                                                image: product.image || '',
                                                                site_name: product.site_name || '',
                                                                is_active: product.is_active
                                                            });
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="p-1.5 text-text-muted hover:text-primary transition-colors rounded hover:bg-primary/10"
                                                        title="Edit product"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Remove this product?')) return;
                                                            const token = localStorage.getItem('token');
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/products/${product.id}`, {
                                                                method: 'DELETE',
                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                            });
                                                            if (res.ok) setProducts(prev => prev.filter(p => p.id !== product.id));
                                                        }}
                                                        className="p-1.5 text-text-muted hover:text-red-500 transition-colors rounded hover:bg-red-500/10"
                                                        title="Remove product"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {products.length === 0 && !productMeta && (
                            <div className="text-center py-8 text-text-secondary">
                                <div className="text-4xl mb-3">🛍️</div>
                                <p className="text-sm">No sponsored products yet.</p>
                                <p className="text-xs text-text-muted mt-1">Paste a product link above to get started.</p>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'music' ? (
                    <div className="space-y-6">
                        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">🎵 Add Music Link</h2>
                                <span className="text-xs text-text-muted">{musicLinks.length} Tracks</span>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Track / Album URL</label>
                                    <input
                                        type="url"
                                        value={musicUrl}
                                        onChange={e => setMusicUrl(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50 text-sm"
                                        placeholder="https://open.spotify.com/track/..."
                                    />
                                    <p className="text-xs text-text-muted">Supports Spotify, Apple Music, SoundCloud, and YouTube URLs.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Display Title (Optional)</label>
                                    <input
                                        type="text"
                                        value={musicTitle}
                                        onChange={e => setMusicTitle(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50 text-sm"
                                        placeholder="My new single..."
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            if (!musicUrl) return;
                                            setIsSavingMusic(true);
                                            // Very basic platform guesser
                                            let platform = 'other';
                                            if (musicUrl.includes('spotify.com')) platform = 'spotify';
                                            else if (musicUrl.includes('apple.com')) platform = 'apple_music';
                                            else if (musicUrl.includes('soundcloud.com')) platform = 'soundcloud';
                                            else if (musicUrl.includes('youtube.com') || musicUrl.includes('youtu.be')) platform = 'youtube';

                                            const newMusic: MusicLink = {
                                                id: editingMusicId || `m_${Date.now()}`,
                                                url: musicUrl,
                                                title: musicTitle,
                                                platform,
                                                added_at: new Date().toISOString(),
                                                is_active: true
                                            };

                                            let newMusicLinks;
                                            if (editingMusicId) {
                                                newMusicLinks = musicLinks.map(m => m.id === editingMusicId ? newMusic : m);
                                            } else {
                                                newMusicLinks = [newMusic, ...musicLinks];
                                            }

                                            setMusicLinks(newMusicLinks);
                                            setMusicUrl('');
                                            setMusicTitle('');
                                            setEditingMusicId(null);
                                            setIsSavingMusic(false);

                                            // Trigger an auto-save
                                            handleAppearanceSave({ music_links: newMusicLinks });
                                        }}
                                        className="px-6 py-2 bg-primary text-black text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                    >
                                        {isSavingMusic ? 'Saving...' : (editingMusicId ? 'Update Music' : 'Add Music')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Music List */}
                        {musicLinks.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Added Music</h3>
                                <div className="space-y-2">
                                    {musicLinks.map((music: any) => (
                                        <div key={music.id} className={`bg-surface border ${pinnedItems.music === music.id ? 'border-primary' : 'border-border'} rounded-xl p-3 flex items-center justify-between group transition-all ${music.is_active === false ? 'opacity-50 hover:opacity-75' : ''}`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xl">
                                                        {music.platform === 'spotify' ? '🟢' :
                                                            music.platform === 'apple_music' ? '🍎' :
                                                                music.platform === 'soundcloud' ? '☁️' :
                                                                    music.platform === 'youtube' ? '📺' : '🎵'}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${music.is_active === false ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                                        {pinnedItems.music === music.id && <span className="mr-1">📌</span>}
                                                        {music.title || music.url}
                                                    </p>
                                                    <p className="text-xs text-text-muted truncate capitalize">{music.platform.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                        e.preventDefault();
                                                        const newPinnedItems: any = { ...pinnedItems, music: (pinnedItems as any)?.music === music.id ? null : music.id };
                                                        setPinnedItems(newPinnedItems);
                                                        handleAppearanceSave({ pinned_items: newPinnedItems });
                                                    }}
                                                    className={`p-1.5 transition-colors rounded ${pinnedItems.music === music.id ? 'text-primary' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
                                                    title={pinnedItems.music === music.id ? "Unpin track" : "Pin to top"}
                                                >
                                                    📌
                                                </button>
                                                <button
                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                        e.preventDefault();
                                                        const updated = musicLinks.map(m => m.id === music.id ? { ...m, is_active: m.is_active === false ? true : false } : m);
                                                        setMusicLinks(updated);
                                                        handleAppearanceSave({ music_links: updated });
                                                    }}
                                                    className={`p-1.5 transition-colors rounded ${music.is_active !== false ? 'text-text-muted hover:text-amber-500 hover:bg-amber-500/10' : 'text-text-muted hover:text-green-500 hover:bg-green-500/10'}`}
                                                >
                                                    {music.is_active !== false ? (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setEditingMusicId(music.id);
                                                        setMusicUrl(music.url);
                                                        setMusicTitle(music.title || '');
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="p-1.5 text-text-muted hover:text-primary transition-colors rounded hover:bg-primary/10"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (!confirm('Remove this track?')) return;
                                                        const updated = musicLinks.filter(m => m.id !== music.id);
                                                        setMusicLinks(updated);

                                                        let newPinned = pinnedItems;
                                                        if ((pinnedItems as any)?.music === music.id) {
                                                            newPinned = { ...(pinnedItems as any), music: null };
                                                            (setPinnedItems as any)(newPinned);
                                                        }
                                                        handleAppearanceSave({ music_links: updated, pinned_items: newPinned });
                                                    }}
                                                    className="p-1.5 text-text-muted hover:text-red-500 transition-colors rounded hover:bg-red-500/10"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {musicLinks.length === 0 && (
                            <div className="text-center py-8 text-text-secondary">
                                <div className="text-4xl mb-3">🎵</div>
                                <p className="text-sm">No music added yet.</p>
                                <p className="text-xs text-text-muted mt-1">Paste a Spotify, Apple Music, or SoundCloud link above.</p>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'events' ? (
                    <div className="space-y-6">
                        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">📅 Add Event</h2>
                                <span className="text-xs text-text-muted">{events.length} Events</span>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Event Title</label>
                                    <input
                                        type="text"
                                        value={eventTitle}
                                        onChange={e => setEventTitle(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary text-sm"
                                        placeholder="World Tour 2026..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Date & Time</label>
                                        <input
                                            type="date"
                                            value={eventDate}
                                            onChange={e => setEventDate(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Venue / Address</label>
                                        <input
                                            type="text"
                                            value={eventVenue}
                                            onChange={e => setEventVenue(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary text-sm"
                                            placeholder="Madison Square Garden, NY"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-text-secondary">Ticket Link (Optional)</label>
                                    <input
                                        type="url"
                                        value={eventUrl}
                                        onChange={e => setEventUrl(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50 text-sm"
                                        placeholder="https://ticketmaster.com/..."
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        disabled={!eventTitle || !eventDate || isSavingEvent}
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            if (!eventTitle || !eventDate) return;
                                            setIsSavingEvent(true);

                                            const newEvent = {
                                                id: editingEventId || `e_${Date.now()}`,
                                                title: eventTitle,
                                                date: eventDate,
                                                venue: eventVenue,
                                                ticket_url: eventUrl,
                                                added_at: new Date().toISOString(),
                                                is_active: true
                                            };

                                            let newEvents;
                                            if (editingEventId) {
                                                newEvents = events.map(e => e.id === editingEventId ? newEvent : e);
                                            } else {
                                                newEvents = [newEvent, ...events];
                                            }

                                            setEvents(newEvents);
                                            setEventTitle('');
                                            setEventDate('');
                                            setEventVenue('');
                                            setEventUrl('');
                                            setEditingEventId(null);
                                            setIsSavingEvent(false);

                                            handleAppearanceSave({ events: newEvents });
                                        }}
                                        className="px-6 py-2 bg-primary text-black text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                    >
                                        {isSavingEvent ? 'Saving...' : (editingEventId ? 'Update Event' : 'Add Event')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Events List */}
                        {events.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Upcoming Events</h3>
                                <div className="space-y-2">
                                    {events.map((event: any) => (
                                        <div key={event.id} className={`bg-surface border ${pinnedItems.events === event.id ? 'border-primary' : 'border-border'} rounded-xl p-3 flex items-center justify-between group transition-all ${event.is_active === false ? 'opacity-50 hover:opacity-75' : ''}`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-surface-light flex flex-col items-center justify-center flex-shrink-0 border border-border">
                                                    <span className="text-[10px] font-bold text-text-primary uppercase">
                                                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}
                                                    </span>
                                                    <span className="text-sm font-bold text-primary">
                                                        {new Date(event.date).getDate()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${event.is_active === false ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                                        {pinnedItems.events === event.id && <span className="mr-1">📌</span>}
                                                        {event.title}
                                                    </p>
                                                    <p className="text-xs text-text-muted truncate">{event.venue || 'No venue specified'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const newPinnedItems: any = { ...pinnedItems, events: (pinnedItems as any)?.events === event.id ? null : event.id };
                                                        setPinnedItems(newPinnedItems);
                                                        handleAppearanceSave({ pinned_items: newPinnedItems });
                                                    }}
                                                    className={`p-1.5 transition-colors rounded ${pinnedItems.events === event.id ? 'text-primary' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
                                                    title={pinnedItems.events === event.id ? "Unpin event" : "Pin to top"}
                                                >
                                                    📌
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const updated = events.map(ev => ev.id === event.id ? { ...ev, is_active: ev.is_active === false ? true : false } : ev);
                                                        setEvents(updated);
                                                        handleAppearanceSave({ events: updated });
                                                    }}
                                                    className={`p-1.5 transition-colors rounded ${event.is_active !== false ? 'text-text-muted hover:text-amber-500 hover:bg-amber-500/10' : 'text-text-muted hover:text-green-500 hover:bg-green-500/10'}`}
                                                >
                                                    {event.is_active !== false ? (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setEditingEventId(event.id);
                                                        setEventTitle(event.title);
                                                        setEventDate(event.date);
                                                        setEventVenue(event.venue || '');
                                                        setEventUrl(event.ticket_url || '');
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="p-1.5 text-text-muted hover:text-primary transition-colors rounded hover:bg-primary/10"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (!confirm('Remove this event?')) return;
                                                        const updated = events.filter(ev => ev.id !== event.id);
                                                        setEvents(updated);

                                                        let newPinned = pinnedItems;
                                                        if ((pinnedItems as any)?.events === event.id) {
                                                            newPinned = { ...pinnedItems, events: null };
                                                            setPinnedItems(newPinned);
                                                        }
                                                        handleAppearanceSave({ events: updated, pinned_items: newPinned });
                                                    }}
                                                    className="p-1.5 text-text-muted hover:text-red-500 transition-colors rounded hover:bg-red-500/10"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {events.length === 0 && (
                            <div className="text-center py-8 text-text-secondary">
                                <div className="text-4xl mb-3">📅</div>
                                <p className="text-sm">No events added yet.</p>
                                <p className="text-xs text-text-muted mt-1">Add your upcoming shows, meet & greets, or live streams.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6"> {/* Parent div for appearance tab content */}
                        <Accordion type="multiple" defaultValue={['tab-visibility', 'accent-colors']} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            {/* ═══ SECTION 0: TAB VISIBILITY ═══ */}
                            <AccordionItem value="tab-visibility" className="bg-surface border border-border rounded-xl px-5 border-b-0 shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-5 text-sm font-bold text-text-primary uppercase tracking-wider text-left">
                                    <div className="flex items-center gap-2">
                                        👁️ Tab Visibility
                                        <InfoTooltip content="Choose which tabs are visible on your public profile. You can also hide tabs temporarily." />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 space-y-4 pt-1">
                                    {[
                                        { id: 'links', label: 'Links Tab', default: true },
                                        { id: 'shop', label: 'Shop Tab', default: true },
                                        { id: 'videos', label: 'Videos Tab', default: true },
                                        { id: 'music', label: 'Music Tab', default: true },
                                        { id: 'events', label: 'Events Tab', default: true },
                                    ].map((tabConfig) => {
                                        const isVisible = appearance.tab_visibility?.[tabConfig.id as keyof typeof appearance.tab_visibility] !== false;
                                        return (
                                            <div key={tabConfig.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-light">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-text-primary">{tabConfig.label}</span>
                                                    <span className="text-xs text-text-muted">Show or hide this tab on your profile</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const currentVis = appearance.tab_visibility || { links: true, shop: true, videos: true, music: true, events: true };
                                                        const newVisibility = {
                                                            ...currentVis,
                                                            [tabConfig.id]: !isVisible
                                                        };
                                                        setAppearance(prev => ({
                                                            ...prev,
                                                            tab_visibility: newVisibility
                                                        }));
                                                        handleAppearanceSave({ tab_visibility: newVisibility });
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isVisible ? 'bg-primary' : 'bg-surface-dark border-border'}`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isVisible ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </AccordionContent>
                            </AccordionItem>

                            {/* ═══ SECTION: LAYOUTS & SHAPES ═══ */}
                            <AccordionItem value="layouts_shapes" className="bg-surface border border-border rounded-xl px-5 border-b-0 shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-5 text-sm font-bold text-text-primary uppercase tracking-wider text-left">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                        </svg>
                                        Layouts & Shapes
                                        <InfoTooltip content="Customize the structure of your card and the shape of your profile picture. Some layouts and shapes require Pro or Elite plans." />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 pt-1 space-y-8">
                                    {/* Layout Selection */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Card Layout</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {LAYOUTS.map(layout => {
                                                const isActive = appearance.layout === layout.id;
                                                const isLocked = (layout.tier === 'pro' && !isPro) || (layout.tier === 'elite' && profile?.plan !== 'elite');
                                                
                                                return (
                                                    <button
                                                        key={layout.id}
                                                        onClick={() => {
                                                            if (!isLocked) setAppearance(prev => ({ ...prev, layout: layout.id }));
                                                        }}
                                                        className={`relative flex flex-col p-4 rounded-xl border text-left transition-all duration-200 ${isActive ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-sm' : 'border-border bg-surface-light hover:border-primary/50'} ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                                                    >
                                                        {isLocked && (
                                                            <div className="absolute top-2 right-2">
                                                                <span className="text-[9px] font-bold bg-[#fbbf24] text-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1">
                                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                                    {layout.tier}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className="font-bold text-text-primary mb-1">{layout.name}</span>
                                                        <span className="text-xs text-text-muted">{layout.description}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Shape Selection */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Avatar Shape</h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                            {SHAPES.map(shape => {
                                                const isActive = appearance.avatar_shape === shape.id;
                                                const isLocked = (shape.tier === 'pro' && !isPro) || (shape.tier === 'elite' && profile?.plan !== 'elite');
                                                
                                                // Preview shape CSS classes
                                                let shapeClass = 'rounded-full';
                                                let styleObj = {};
                                                if (shape.id === 'squircle') shapeClass = 'rounded-2xl';
                                                else if (shape.id === 'hexagon') styleObj = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
                                                else if (shape.id === 'archway') shapeClass = 'rounded-t-full rounded-b-md';
                                                else if (shape.id === 'starburst') styleObj = { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };

                                                return (
                                                    <button
                                                        key={shape.id}
                                                        onClick={() => {
                                                            if (!isLocked) setAppearance(prev => ({ ...prev, avatar_shape: shape.id }));
                                                        }}
                                                        title={shape.name}
                                                        className={`relative flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${isActive ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border bg-surface-light hover:border-primary/50'} ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.05]'}`}
                                                    >
                                                        {isLocked && (
                                                            <div className="absolute -top-1.5 -right-1.5 z-10">
                                                                <span className="flex items-center justify-center w-5 h-5 bg-surface-dark rounded-full shadow-sm text-[#fbbf24] border border-[#fbbf24]/30">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`w-10 h-10 bg-primary/20 bg-gradient-to-br from-primary/40 to-primary/10 mb-2 border border-primary/30 ${shapeClass}`} style={styleObj} />
                                                        <span className="text-[10px] font-bold text-text-secondary w-full truncate">{shape.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Upload Banner Section (for Hero layout) */}
                                    {appearance.layout === 'hero' && (
                                        <div className="pt-4 border-t border-border mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Cover Banner Image</h3>
                                            <div className="relative border-2 border-dashed border-border rounded-xl aspect-[3/1] bg-surface-dark flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors group">
                                                {appearance.banner_image_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={appearance.banner_image_url} alt="Banner" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center text-text-muted group-hover:text-primary transition-colors">
                                                        <svg className="w-8 h-8 mx-auto mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="text-sm font-medium">Upload Banner Image</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const token = localStorage.getItem('token');
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        try {
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/upload`, {
                                                                method: 'POST',
                                                                headers: { 'Authorization': `Bearer ${token}` },
                                                                body: formData
                                                            });
                                                            if (res.ok) {
                                                                const data = await res.json();
                                                                setAppearance(prev => ({ ...prev, banner_image_url: data.url }));
                                                            }
                                                        } catch (err) {
                                                            console.error('Failed to upload banner', err);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>

                            {/* ═══ SECTION: TYPOGRAPHY (PRO/ELITE) ═══ */}
                            <AccordionItem value="typography" className="bg-surface border border-border rounded-xl px-5 border-b-0 shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-5 text-sm font-bold text-text-primary uppercase tracking-wider text-left">
                                    <div className="flex items-center gap-2">
                                        ✦ Typography
                                        <InfoTooltip content="Choose a font pair and custom text colors for your creator card. Available on Pro & Elite plans." />
                                        {!isPro && <span className="text-[10px] font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full">PRO</span>}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 space-y-6 pt-1">
                                    {!isPro ? (
                                        <div className="relative">
                                            <div className="blur-sm opacity-50 pointer-events-none select-none space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    {FONT_PAIRS.slice(0, 4).map(fp => (
                                                        <div key={fp.id} className="p-4 rounded-xl border border-border bg-surface-light">
                                                            <p style={{ fontFamily: 'serif' }} className="text-lg font-bold text-text-primary truncate">Heading</p>
                                                            <p className="text-sm text-text-secondary truncate">Body text</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center px-6">
                                                    <p className="text-text-primary font-bold mb-1">Custom Typography</p>
                                                    <p className="text-sm text-text-muted mb-3">Available on Pro and Elite plans</p>
                                                    <button
                                                        onClick={() => window.location.href = '/dashboard/billing'}
                                                        className="bg-primary hover:bg-primary/90 text-black text-sm font-bold py-2 px-5 rounded-full transition-all hover:scale-105"
                                                    >
                                                        Upgrade to Pro →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Dynamic Google Font Loading */}
                                            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                                            <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

                                            {/* Font Pair Grid */}
                                            <div>
                                                <label className="text-sm font-medium text-text-secondary mb-3 block">Font Pair</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {FONT_PAIRS.map(fp => {
                                                        const isActive = appearance.font_pair === fp.id;
                                                        return (
                                                            <button
                                                                key={fp.id}
                                                                onClick={() => setAppearance(prev => ({ ...prev, font_pair: fp.id }))}
                                                                className={`p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] ${isActive
                                                                    ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                                                    : 'border-border bg-surface-light hover:border-primary/50'
                                                                    }`}
                                                            >
                                                                <p
                                                                    style={{ fontFamily: `'${fp.heading}', sans-serif` }}
                                                                    className="text-lg font-bold text-text-primary truncate leading-tight"
                                                                >
                                                                    {fp.name}
                                                                </p>
                                                                <p
                                                                    style={{ fontFamily: `'${fp.body}', sans-serif` }}
                                                                    className="text-xs text-text-muted mt-1 truncate"
                                                                >
                                                                    {fp.heading} + {fp.body}
                                                                </p>
                                                                <span className="text-[10px] text-text-muted/60 mt-1 block">{fp.category}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Font Colors */}
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-text-secondary">Text Colors</label>
                                                    <button
                                                        onClick={() => {
                                                            const palette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
                                                            setAppearance(prev => ({
                                                                ...prev,
                                                                heading_color: palette.heading,
                                                                body_color: palette.body
                                                            }));
                                                        }}
                                                        className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all hover:scale-105 flex items-center gap-1.5"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                                        Feeling Lucky
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs text-text-muted">Heading Color</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={appearance.heading_color || '#ffffff'}
                                                                onChange={(e) => setAppearance(prev => ({ ...prev, heading_color: e.target.value }))}
                                                                className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={appearance.heading_color}
                                                                onChange={(e) => setAppearance(prev => ({ ...prev, heading_color: e.target.value }))}
                                                                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
                                                                placeholder="Auto (theme)"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs text-text-muted">Body Color</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={appearance.body_color || '#aaaaaa'}
                                                                onChange={(e) => setAppearance(prev => ({ ...prev, body_color: e.target.value }))}
                                                                className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={appearance.body_color}
                                                                onChange={(e) => setAppearance(prev => ({ ...prev, body_color: e.target.value }))}
                                                                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
                                                                placeholder="Auto (theme)"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                {(appearance.heading_color || appearance.body_color) && (
                                                    <button
                                                        onClick={() => setAppearance(prev => ({ ...prev, heading_color: '', body_color: '' }))}
                                                        className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                                                    >
                                                        ← Reset to auto theme colors
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </AccordionContent>
                            </AccordionItem>

                            {/* ═══ SECTION 3: MY COLORS ═══ */}
                            <AccordionItem value="accent-colors" className="bg-surface border border-border rounded-xl px-5 border-b-0 shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-5 text-sm font-bold text-text-primary uppercase tracking-wider text-left">
                                    <div className="flex items-center gap-2">
                                        ✦ Accent & Colors
                                        <InfoTooltip content="Select your primary brand color and avatar glow effects." />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 space-y-6 pt-1">
                                    <div className="flex items-center justify-end">
                                        <button onClick={handleRandomize} className="text-xs text-primary hover:text-primary-light transition-colors flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Shuffle
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-text-secondary">Primary Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#ffffff'].map(color => (
                                                <button key={color} onClick={() => setAppearance(prev => ({ ...prev, primary_color: color }))} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${appearance.primary_color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                                            ))}
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-border cursor-pointer group">
                                                <input type="color" value={appearance.primary_color} onChange={e => setAppearance(prev => ({ ...prev, primary_color: e.target.value }))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <div className="w-full h-full bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] opacity-80" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <label className="text-sm font-medium text-text-secondary">Avatar Aura Effect</label>
                                        <div className="grid grid-cols-4 gap-2 bg-surface-light p-1 rounded-lg border border-border">
                                            {['none', 'solid', 'rainbow', 'pulse'].map(aura => (
                                                <button
                                                    key={aura}
                                                    onClick={() => setAppearance(prev => ({ ...prev, avatar_aura: aura as any }))}
                                                    className={`py-1.5 px-3 rounded-md text-xs capitalize transition-all duration-200 ${(appearance.avatar_aura || 'none') === aura
                                                        ? 'bg-surface shadow text-primary font-medium border border-border/50'
                                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-light border border-transparent'
                                                        }`}
                                                >
                                                    {aura}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-text-muted">Hover over your avatar to see the effect.</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* ═══ SECTION 5: BRANDING ═══ */}
                            <AccordionItem value="branding" className="bg-surface border border-border rounded-xl px-5 border-b-0 shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-5 text-sm font-bold text-text-primary uppercase tracking-wider text-left">
                                    <div className="flex items-center gap-2">
                                        ✦ Branding & Logo
                                        <InfoTooltip content="Manage your profile identity, picture, and brand logos." />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 space-y-6 pt-1">
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="space-y-4">
                                            {/* Profile Picture Upload */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-text-secondary">Profile Picture</label>
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-20 h-20 rounded-full border-2 border-border p-1 relative group overflow-hidden"
                                                        style={{ borderColor: appearance.primary_color }}
                                                    >
                                                        <div className="w-full h-full rounded-full overflow-hidden bg-surface-light flex items-center justify-center">
                                                            {isUploadingAvatar ? (
                                                                <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : profile?.avatar_url ? (
                                                                <img src={profile.avatar_url} className="w-full h-full object-cover relative z-10" />
                                                            ) : (
                                                                <span className="text-xl font-bold text-text-secondary">{profile?.display_name?.substring(0, 2).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                            <div className={`w-full h-full flex items-center justify-center ${isUploadingAvatar ? 'hidden' : ''}`}>
                                                                <ImageUpload
                                                                    onUploadStart={() => setIsUploadingAvatar(true)}
                                                                    onUploadEnd={() => setIsUploadingAvatar(false)}
                                                                    onUpload={(url) => setProfile(prev => prev ? ({ ...prev, avatar_url: url }) : null)}
                                                                    className="w-full h-full flex items-center justify-center cursor-pointer"
                                                                >
                                                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                </ImageUpload>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs text-text-secondary mb-2">Upload a profile picture. It will be displayed with a glowing effect matched to your theme.</p>
                                                        {Boolean(profile?.avatar_url) && (
                                                            <button
                                                                onClick={() => setProfile(prev => prev ? ({ ...prev, avatar_url: '' }) : null)}
                                                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                                            >
                                                                Remove Photo
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-text-secondary">Logo URL</label>
                                                <div className="relative">
                                                    <input
                                                        type="url"
                                                        value={appearance.logo_url || ''}
                                                        onChange={(e) => {
                                                            const url = e.target.value;
                                                            setAppearance(prev => ({ ...prev, logo_url: url }));
                                                            setLogoUrlError(null);
                                                            if (url) {
                                                                setIsVerifyingLogo(true);
                                                                const img = new Image();
                                                                img.onload = () => {
                                                                    if (img.naturalWidth > 512 || img.naturalHeight > 512) {
                                                                        setIsVerifyingLogo(false);
                                                                        setLogoUrlError(`Image resolution too high (${img.naturalWidth}x${img.naturalHeight}px). Max allowed is 512x512px.`);
                                                                    } else {
                                                                        setIsVerifyingLogo(false);
                                                                        setLogoUrlError(null);
                                                                    }
                                                                };
                                                                img.onerror = () => {
                                                                    setIsVerifyingLogo(false);
                                                                    setLogoUrlError('Unable to load image. Ensure URL points directly to an image file (png/jpg).');
                                                                };
                                                                img.src = url;
                                                            }
                                                        }}
                                                        className={`w-full bg-background border ${logoUrlError ? 'border-red-500' : 'border-border'} rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary placeholder:text-text-muted/50`}
                                                        placeholder="https://example.com/logo.png"
                                                    />
                                                    {isVerifyingLogo && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary animate-pulse">Verifying...</div>
                                                    )}
                                                </div>
                                                {logoUrlError && <p className="text-xs text-red-500 mt-1">{logoUrlError}</p>}
                                                <p className="text-xs text-text-secondary mt-1">Enter a direct link to your logo image (PNG/JPG/SVG).</p>
                                                <div className="flex gap-2 pt-2">
                                                    <ImageUpload
                                                        onUploadStart={() => setIsUploadingLogoFile(true)}
                                                        onUploadEnd={() => setIsUploadingLogoFile(false)}
                                                        onUpload={(url) => {
                                                            setAppearance(prev => ({ ...prev, logo_url: url }));
                                                            setLogoUrlError(null);
                                                        }}
                                                        className="inline-block"
                                                    >
                                                        <button disabled={isUploadingLogoFile} className="flex items-center gap-2 px-4 py-2 bg-surface border border-dashed border-border rounded-lg text-sm text-text-secondary hover:text-primary hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-wait">
                                                            {isUploadingLogoFile ? (
                                                                <>
                                                                    <svg className="animate-spin w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Uploading...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                                    Upload Image
                                                                </>
                                                            )}
                                                        </button>
                                                    </ImageUpload>
                                                    <button
                                                        onClick={() => {
                                                            setAppearance(prev => ({ ...prev, logo_url: '/logo.svg', logo_position: 'scatter' }));
                                                            setLogoUrlError(null);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-primary hover:border-primary transition-colors"
                                                    >
                                                        Use Official Logo
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium text-text-secondary">Logo Position</label>
                                                    {appearance.logo_position && (
                                                        <span className="text-xs text-primary capitalize">
                                                            {[{ id: 'top_left', label: 'Top Left' }, { id: 'center_top', label: 'Top Center' }, { id: 'top_right', label: 'Top Right' }, { id: 'center', label: 'Center (Hero)' }, { id: 'bottom_left', label: 'Bottom Left' }, { id: 'bottom_right', label: 'Bottom Right' }, { id: 'scatter', label: 'Scatter' }].find(p => p.id === appearance.logo_position)?.label || appearance.logo_position}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Visual 3x3 card position picker */}
                                                <div
                                                    className="relative w-full rounded-xl border-2 border-border bg-surface-light/30 overflow-hidden"
                                                    style={{ aspectRatio: '2/1' }}
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                                        <div className="w-[40%] h-[60%] rounded-lg border border-white/30 flex flex-col items-center justify-center gap-1">
                                                            <div className="w-6 h-6 rounded-full bg-white/40" />
                                                            <div className="w-10 h-1 rounded bg-white/30" />
                                                            <div className="w-8 h-0.5 rounded bg-white/20" />
                                                        </div>
                                                    </div>
                                                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-2 gap-1">
                                                        {[
                                                            { id: 'top_left', row: 0, col: 0 },
                                                            { id: 'center_top', row: 0, col: 1 },
                                                            { id: 'top_right', row: 0, col: 2 },
                                                            { id: null, row: 1, col: 0 },
                                                            { id: 'center', row: 1, col: 1 },
                                                            { id: null, row: 1, col: 2 },
                                                            { id: 'bottom_left', row: 2, col: 0 },
                                                            { id: null, row: 2, col: 1 },
                                                            { id: 'bottom_right', row: 2, col: 2 },
                                                        ].map((cell, i) => {
                                                            const isActive = appearance.logo_position === cell.id;
                                                            return cell.id ? (
                                                                <button
                                                                    key={cell.id}
                                                                    onClick={() => setAppearance(prev => ({ ...prev, logo_position: cell.id as any }))}
                                                                    className={`relative flex items-center justify-center rounded-lg transition-all duration-200 group ${isActive ? 'bg-primary/20' : 'hover:bg-white/5'}`}
                                                                    title={cell.id.replace(/_/g, ' ')}
                                                                >
                                                                    <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${isActive ? 'bg-primary shadow-[0_0_8px_2px] shadow-primary/60 scale-125' : 'bg-white/30 group-hover:bg-white/60 group-hover:scale-110'}`} />
                                                                    {isActive && <div className="absolute inset-0 rounded-lg ring-2 ring-primary/60 ring-inset" />}
                                                                </button>
                                                            ) : (
                                                                <div key={`empty-${i}`} />
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Scatter chip */}
                                                <button
                                                    onClick={() => {
                                                        setAppearance(prev => ({ ...prev, logo_position: 'scatter' as any }));
                                                        generateScatterPositions(appearance.logo_count || 12, appearance.scatter_style || 'random');
                                                    }}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 ${appearance.logo_position === 'scatter' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative w-8 h-5">
                                                            {[{ t: '20%', l: '10%' }, { t: '50%', l: '55%' }, { t: '10%', l: '70%' }, { t: '65%', l: '25%' }].map((p, i) => (
                                                                <div key={i} className={`absolute w-1.5 h-1.5 rounded-full transition-colors ${appearance.logo_position === 'scatter' ? 'bg-primary' : 'bg-text-muted'}`} style={{ top: p.t, left: p.l }} />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-medium">Scatter Pattern</span>
                                                    </div>
                                                    <span className="text-xs opacity-60">Tiled across page</span>
                                                </button>

                                                {/* Logo Size Slider */}
                                                {Boolean(appearance.logo_url) && appearance.logo_position !== 'scatter' && (
                                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-sm font-medium text-text-secondary">Logo Size</label>
                                                            <span className="text-xs font-mono text-primary">{appearance.logo_size || 32}px</span>
                                                        </div>
                                                        <input
                                                            type="range" min="16" max="160" step="4"
                                                            value={appearance.logo_size || 32}
                                                            onChange={e => setAppearance(prev => ({ ...prev, logo_size: parseInt(e.target.value) }))}
                                                            className="w-full accent-primary h-2 bg-surface-light rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-text-muted">
                                                            <span>Small</span>
                                                            {appearance.logo_position === 'center' && <span className="text-primary">↑ Hero mode</span>}
                                                            <span>Large</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {appearance.logo_position === 'scatter' && (
                                            <div className="space-y-6 pt-2 h-full justify-center flex flex-col animate-in fade-in slide-in-from-top-1 bg-surface-light/30 p-4 rounded-xl border border-border/50">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium text-text-secondary">Pattern Opacity</label>
                                                        <span className="text-xs text-text-secondary">{Math.round((appearance.logo_opacity || 0.2) * 100)}%</span>
                                                    </div>
                                                    <input type="range" min="0.05" max="1" step="0.05" value={appearance.logo_opacity || 0.2} onChange={(e) => setAppearance(prev => ({ ...prev, logo_opacity: parseFloat(e.target.value) }))} className="w-full accent-primary h-2 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium text-text-secondary">Item Count</label>
                                                        <span className="text-xs text-text-secondary">{appearance.logo_count || 12} items</span>
                                                    </div>
                                                    <input type="range" min="4" max="30" step="1" value={appearance.logo_count || 12} onChange={(e) => setAppearance(prev => ({ ...prev, logo_count: parseInt(e.target.value) }))} className="w-full accent-primary h-2 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-text-secondary">Pattern Style</label>
                                                    <div className="flex gap-2">
                                                        {['random', 'grid', 'circle'].map(style => (
                                                            <button
                                                                key={style}
                                                                onClick={() => {
                                                                    setAppearance(prev => ({ ...prev, scatter_style: style as any }));
                                                                    if (style === 'random') {
                                                                        generateScatterPositions(appearance.logo_count || 12, 'random');
                                                                    }
                                                                }}
                                                                className={`py-1.5 px-3 rounded-md text-xs capitalize transition-all duration-200 ${(appearance.scatter_style || 'random') === style
                                                                    ? 'bg-surface shadow text-primary font-medium border border-border/50'
                                                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-light border border-transparent'
                                                                    }`}
                                                            >
                                                                {style}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* ═══ SECTION 1: PUBLIC PAGE APPEARANCE ═══ */}
                            <AccordionItem value="public-page" className="bg-surface border border-border rounded-xl px-5 border-b-0 shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-5 text-sm font-bold text-text-primary uppercase tracking-wider text-left">
                                    <div className="flex items-center gap-2">
                                        ✦ Public Page Styling
                                        <InfoTooltip content="Design the overall look and feel of your public profile background." />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 space-y-6 pt-1">
                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-text-secondary">Background Type</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['color', 'gradient', 'image', 'emoji'].map(type => {
                                                const isPremium = type !== 'color';
                                                const disabled = isPremium && !isPro;
                                                return (
                                                    <button
                                                        key={type}
                                                        disabled={disabled}
                                                        onClick={() => setAppearance(prev => ({ ...prev, public_background_type: type as any }))}
                                                        className={`py-2 px-3 rounded-lg border text-sm capitalize transition-all flex items-center justify-center gap-1.5 ${appearance.public_background_type === type ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-text-secondary'} ${disabled ? 'opacity-50 cursor-not-allowed cursor-help' : 'hover:text-text-primary'}`}
                                                        title={disabled ? "Upgrade to Pro to unlock" : ""}
                                                    >
                                                        {type}
                                                        {disabled && <span className="text-[10px] bg-primary text-background px-1.5 py-0.5 rounded-full font-bold ml-1">PRO</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {appearance.public_background_type === 'color' && (
                                            <div className="flex items-center gap-3">
                                                <input type="color" value={appearance.public_background_color} onChange={e => setAppearance(prev => ({ ...prev, public_background_color: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-border p-1" />
                                                <span className="text-sm text-text-secondary font-mono">{appearance.public_background_color}</span>
                                            </div>
                                        )}
                                        {appearance.public_background_type === 'gradient' && (
                                            <div className="flex gap-2">
                                                <input type="text" value={appearance.public_background_gradient || ''} onChange={e => setAppearance(prev => ({ ...prev, public_background_gradient: e.target.value }))} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none" placeholder="linear-gradient(...)" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const colors = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
                                                        setAppearance(prev => ({ ...prev, public_background_gradient: `linear-gradient(${Math.floor(Math.random() * 360)}deg, ${colors.join(', ')})` }));
                                                    }}
                                                    className="px-4 py-2 bg-surface-light border border-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center justify-center group"
                                                    title="Generate Random Gradient"
                                                >
                                                    <svg className="w-5 h-5 group-active:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                </button>
                                            </div>
                                        )}
                                        {appearance.public_background_type === 'image' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-text-secondary">Background Image URL</label>
                                                <input type="url" value={appearance.public_background_image || ''} onChange={e => setAppearance(prev => ({ ...prev, public_background_image: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none" placeholder="https://example.com/background.jpg" />
                                                <p className="text-xs text-text-secondary mt-1">Enter a direct link to your background image (PNG/JPG).</p>
                                                <ImageUpload
                                                    onUpload={(url) => setAppearance(prev => ({ ...prev, public_background_image: url }))}
                                                    className="inline-block"
                                                >
                                                    <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-dashed border-border rounded-lg text-sm text-text-secondary hover:text-primary hover:border-primary transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                        Upload Image
                                                    </button>
                                                </ImageUpload>
                                            </div>
                                        )}
                                        {appearance.public_background_type === 'emoji' && (
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium text-text-secondary">Emoji Pattern</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const pool = ['✨', '🌟', '⭐', '💫', '🔥', '🌈', '🎉', '🎊', '💎', '🚀', '🌸', '🌺', '🍀', '🦋', '🐉', '🌙', '☀️', '⚡', '🎯', '🎮', '🎵', '🎶', '❤️', '💜', '💙', '🧡', '💚', '🌊', '🏔️', '🌴', '🦄', '🐬', '💥', '✴️', '🎆', '🦎', '🦊', '🦅', '🐙', '🎭', '🢐', '🌋', '🌀', '🦋', '🍁', '🌾', '🐾', '🎪', '🌻', '🦁'];
                                                                const shuffled = [...pool].sort(() => Math.random() - 0.5);
                                                                setAppearance(prev => ({ ...prev, public_background_emojis: shuffled.slice(0, 10).join('') }));
                                                            }}
                                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded-lg text-xs text-text-secondary hover:text-primary hover:border-primary transition-all group"
                                                        >
                                                            <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                            Random
                                                        </button>
                                                    </div>
                                                    <input type="text" value={appearance.public_background_emojis || ''} onChange={e => setAppearance(prev => ({ ...prev, public_background_emojis: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none" placeholder="✨🚀💡" />
                                                    <p className="text-xs text-text-secondary">Type your own or hit Random to pick 10 at once.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-text-secondary">Pattern Style</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { id: 'scatter', label: 'Scatter', icon: '✦' },
                                                            { id: 'grid', label: 'Grid', icon: '⊞' },
                                                            { id: 'floating', label: 'Floating', icon: '↑' },
                                                        ].map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => setAppearance(prev => ({ ...prev, public_background_emoji_pattern: p.id as any }))}
                                                                className={`py-2 px-3 rounded-lg border text-xs transition-all flex flex-col items-center gap-1 ${(appearance.public_background_emoji_pattern || 'scatter') === p.id ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-text-secondary hover:text-text-primary hover:border-border-hover'}`}
                                                            >
                                                                <span className="text-base">{p.icon}</span>
                                                                <span>{p.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-text-muted">
                                                        {(appearance.public_background_emoji_pattern || 'scatter') === 'scatter' && 'Randomly scattered emojis with various sizes, rotations, and blur.'}
                                                        {appearance.public_background_emoji_pattern === 'grid' && 'Neatly aligned rows and columns of emojis.'}
                                                        {appearance.public_background_emoji_pattern === 'floating' && 'Emojis drift slowly across the page with smooth CSS animations.'}
                                                    </p>
                                                </div>

                                                {appearance.public_background_emoji_pattern === 'floating' && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                                        <label className="text-sm font-medium text-text-secondary">Float Direction</label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {[
                                                                { id: 'up', label: 'Up', icon: '↑' },
                                                                { id: 'down', label: 'Down', icon: '↓' },
                                                                { id: 'left', label: 'Left', icon: '←' },
                                                                { id: 'right', label: 'Right', icon: '→' },
                                                            ].map(d => (
                                                                <button
                                                                    key={d.id}
                                                                    onClick={() => setAppearance(prev => ({ ...prev, public_background_emoji_direction: d.id as any }))}
                                                                    className={`py-2 px-2 rounded-lg border text-xs transition-all flex flex-col items-center gap-1 ${(appearance.public_background_emoji_direction || 'up') === d.id ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-text-secondary hover:text-text-primary hover:border-border-hover'}`}
                                                                >
                                                                    <span className="text-base">{d.icon}</span>
                                                                    <span>{d.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* ── Card Configuration ── */}
                            <AccordionItem value="card-config" className="bg-surface border border-border rounded-xl px-5 border-b-0 shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-5 text-sm font-bold text-text-primary uppercase tracking-wider text-left">
                                    <div className="flex items-center gap-2">
                                        ✦ Card Configuration
                                        <InfoTooltip content="Customize the appearance of your links card, shape, and lighting." />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 space-y-6 pt-1">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-text-secondary">Card Background</label>
                                            <div className="grid grid-cols-3 gap-2 bg-surface-light p-1 rounded-lg border border-border">
                                                {['color', 'gradient', 'image'].map((type) => {
                                                    const isPremium = type !== 'color';
                                                    const disabled = isPremium && !isPro;
                                                    return (
                                                        <button
                                                            key={type}
                                                            disabled={disabled}
                                                            onClick={() => setAppearance(prev => ({ ...prev, card_background_type: type as any }))}
                                                            className={`py-1.5 px-3 rounded-md text-xs capitalize transition-all duration-200 flex items-center justify-center gap-1.5 ${(appearance.card_background_type || 'color') === type
                                                                ? 'bg-surface shadow text-primary font-medium'
                                                                : 'text-text-secondary'
                                                                } ${disabled ? 'opacity-50 cursor-not-allowed cursor-help' : 'hover:text-text-primary'}`}
                                                            title={disabled ? "Upgrade to Pro to unlock" : ""}
                                                        >
                                                            {type}
                                                            {disabled && <span className="text-[9px] bg-primary text-background px-1 py-0.5 rounded font-bold ml-1">PRO</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-surface-light/30 rounded-lg border border-border/50">
                                            {(!appearance.card_background_type || appearance.card_background_type === 'color') && (
                                                <div className="space-y-3">
                                                    <label className="text-xs font-medium text-text-secondary">Background Color</label>
                                                    <div className="flex gap-2">
                                                        <input type="color" value={appearance.background_color || '#000000'} onChange={(e) => setAppearance(prev => ({ ...prev, background_color: e.target.value }))} className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent p-0.5" />
                                                        <input type="text" value={appearance.background_color || '#000000'} onChange={(e) => setAppearance(prev => ({ ...prev, background_color: e.target.value }))} className="flex-1 bg-surface border border-border rounded px-3 text-sm text-text-primary uppercase font-mono" placeholder="#000000" />
                                                    </div>
                                                </div>
                                            )}
                                            {appearance.card_background_type === 'gradient' && (() => {
                                                // Parse current gradient or use defaults
                                                const currentGrad = appearance.card_background_gradient || 'linear-gradient(135deg, #667eea, #764ba2)';
                                                const angleMatch = currentGrad.match(/(\d+)deg/);
                                                const currentAngle = angleMatch ? parseInt(angleMatch[1]) : 135;
                                                const colorMatches = currentGrad.match(/#[0-9a-fA-F]{6}/g) || ['#667eea', '#764ba2'];
                                                const color1 = colorMatches[0] || '#667eea';
                                                const color2 = colorMatches[colorMatches.length - 1] || '#764ba2';

                                                const buildGradient = (c1: string, c2: string, angle: number) =>
                                                    `linear-gradient(${angle}deg, ${c1}, ${c2})`;

                                                const PRESETS = [
                                                    { name: 'Midnight', grad: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
                                                    { name: 'Ocean', grad: 'linear-gradient(135deg, #1a6cf5, #00d4ff)' },
                                                    { name: 'Aurora', grad: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
                                                    { name: 'Sunset', grad: 'linear-gradient(135deg, #f7971e, #ffd200, #f7971e)' },
                                                    { name: 'Candy', grad: 'linear-gradient(135deg, #f953c6, #b91d73)' },
                                                    { name: 'Cosmic', grad: 'linear-gradient(135deg, #200122, #6f0000)' },
                                                    { name: 'Forest', grad: 'linear-gradient(135deg, #134e5e, #71b280)' },
                                                    { name: 'Nebula', grad: 'linear-gradient(135deg, #ee0979, #ff6a00)' },
                                                    { name: 'Rose', grad: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)' },
                                                ];

                                                const randomizeGradient = () => {
                                                    const h1 = Math.floor(Math.random() * 360);
                                                    const h2 = (h1 + 120 + Math.floor(Math.random() * 60)) % 360;
                                                    const s = 70 + Math.floor(Math.random() * 20);
                                                    const l = 45 + Math.floor(Math.random() * 15);
                                                    const angle = Math.floor(Math.random() * 360);
                                                    const hslToHex = (h: number, s: number, l: number) => {
                                                        s /= 100; l /= 100;
                                                        const a = s * Math.min(l, 1 - l);
                                                        const f = (n: number) => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, '0'); };
                                                        return `#${f(0)}${f(8)}${f(4)}`;
                                                    };
                                                    setAppearance(prev => ({ ...prev, card_background_gradient: buildGradient(hslToHex(h1, s, l), hslToHex(h2, s, l), angle) }));
                                                };

                                                return (
                                                    <div className="space-y-4">
                                                        {/* Live Preview Bar */}
                                                        <div
                                                            className="w-full h-16 rounded-xl shadow-lg transition-all duration-500 relative overflow-hidden"
                                                            style={{ background: currentGrad }}
                                                        >
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                <span className="text-white/80 text-xs font-mono bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full truncate max-w-[90%]">{currentGrad}</span>
                                                            </div>
                                                        </div>

                                                        {/* Color Stop Pickers */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {[
                                                                { label: 'Start Color', color: color1, key: 'c1' as const },
                                                                { label: 'End Color', color: color2, key: 'c2' as const },
                                                            ].map(({ label, color, key }) => (
                                                                <div key={key} className="space-y-1.5">
                                                                    <label className="text-xs font-medium text-text-muted">{label}</label>
                                                                    <div className="flex items-center gap-2 bg-surface rounded-lg border border-border p-1.5">
                                                                        <input
                                                                            type="color"
                                                                            value={color}
                                                                            onChange={e => {
                                                                                const nc1 = key === 'c1' ? e.target.value : color1;
                                                                                const nc2 = key === 'c2' ? e.target.value : color2;
                                                                                setAppearance(prev => ({ ...prev, card_background_gradient: buildGradient(nc1, nc2, currentAngle) }));
                                                                            }}
                                                                            className="w-8 h-8 rounded-md border-0 cursor-pointer p-0 bg-transparent shrink-0"
                                                                            style={{ colorScheme: 'dark' }}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={color.toUpperCase()}
                                                                            onChange={e => {
                                                                                const v = e.target.value;
                                                                                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                                                                                    const nc1 = key === 'c1' ? v : color1;
                                                                                    const nc2 = key === 'c2' ? v : color2;
                                                                                    setAppearance(prev => ({ ...prev, card_background_gradient: buildGradient(nc1, nc2, currentAngle) }));
                                                                                }
                                                                            }}
                                                                            className="flex-1 bg-transparent text-xs text-text-primary font-mono focus:outline-none min-w-0"
                                                                            maxLength={7}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Angle Slider */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-xs font-medium text-text-muted">Angle</label>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-mono text-primary">{currentAngle}°</span>
                                                                    <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center" style={{ background: `conic-gradient(from ${currentAngle}deg, ${color1}, ${color2}, ${color1})` }} />
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="360"
                                                                value={currentAngle}
                                                                onChange={e => setAppearance(prev => ({ ...prev, card_background_gradient: buildGradient(color1, color2, parseInt(e.target.value)) }))}
                                                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                                                style={{ background: `linear-gradient(to right, ${color1}, ${color2})` }}
                                                            />
                                                        </div>

                                                        {/* Presets Grid */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-xs font-medium text-text-muted">Presets</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={randomizeGradient}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-secondary hover:text-primary hover:border-primary transition-all group"
                                                                    title="Generate harmonious random gradient"
                                                                >
                                                                    <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                                    Randomize
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {PRESETS.map((p) => (
                                                                    <button
                                                                        key={p.name}
                                                                        onClick={() => setAppearance(prev => ({ ...prev, card_background_gradient: p.grad }))}
                                                                        className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg ${currentGrad === p.grad ? 'border-primary shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.4)]' : 'border-transparent hover:border-white/30'}`}
                                                                        style={{ background: p.grad }}
                                                                        title={p.name}
                                                                    >
                                                                        <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{p.name}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            {appearance.card_background_type === 'image' && (
                                                <div className="space-y-3">
                                                    <label className="text-xs font-medium text-text-secondary">Upload Background</label>
                                                    <ImageUpload onUpload={(url) => setAppearance(prev => ({ ...prev, background_image: url }))} className="w-full">
                                                        <div className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-surface-light transition-colors group">
                                                            {Boolean(appearance.background_image) ? (
                                                                <img src={appearance.background_image} className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                                                            ) : (
                                                                <>
                                                                    <svg className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                    <span className="text-xs text-text-secondary">Click to upload image</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </ImageUpload>
                                                    {Boolean(appearance.background_image) && (
                                                        <button onClick={() => setAppearance(prev => ({ ...prev, background_image: '' }))} className="text-xs text-red-400 hover:text-red-300 transition-colors w-full text-center">
                                                            Remove Image
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-text-secondary">Link Layout</label>
                                        <div className="flex bg-surface-light rounded-lg p-1 border border-border">
                                            {['list', 'grid', 'row'].map(style => (
                                                <button key={style} onClick={() => setAppearance(prev => ({ ...prev, link_style: style as any }))} className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${appearance.link_style === style ? 'bg-surface shadow text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>{style}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-text-secondary">Shop Layout</label>
                                        <div className="flex bg-surface-light rounded-lg p-1 border border-border">
                                            {['list', 'grid', 'bento'].map(layout => (
                                                <button key={layout} onClick={() => setAppearance(prev => ({ ...prev, shop_layout: layout as any }))} className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${(appearance.shop_layout || 'list') === layout ? 'bg-surface shadow text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>{layout === 'bento' ? 'Bento Box' : layout}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-secondary">Card Shape</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['classic', 'modern', 'sharp', 'pill'].map(style => (
                                                <button
                                                    key={style}
                                                    onClick={() => setAppearance(prev => ({ ...prev, card_style: style as any }))}
                                                    className={`h-10 border rounded-lg flex items-center justify-center transition-all ${appearance.card_style === style ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}
                                                    title={style}
                                                >
                                                    <div className={`w-6 h-3 border-2 border-current ${style === 'classic' ? 'rounded-sm' : style === 'modern' ? 'rounded-md' : style === 'sharp' ? 'rounded-none' : 'rounded-full'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <label className="text-sm font-medium text-text-secondary">Card Theme</label>
                                        <div className="flex bg-surface-light rounded-lg p-1 border border-border">
                                            {['light', 'dark'].map(theme => (
                                                <button key={theme} onClick={() => setAppearance(prev => ({ ...prev, public_card_theme: theme as any }))} className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${appearance.public_card_theme === theme ? 'bg-surface shadow text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>{theme}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-text-secondary"><span>Card Glow</span><span>{appearance.public_card_glow}</span></div>
                                        <input type="range" min="0" max="100" step="5" value={appearance.public_card_glow} onChange={e => setAppearance(prev => ({ ...prev, public_card_glow: parseInt(e.target.value) }))} className="w-full accent-primary h-1.5 bg-surface-light rounded-lg appearance-none cursor-pointer" />
                                    </div>

                                    {/* PRESET THEMES (PREMIUM) */}
                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-text-primary">Artist Themes</h3>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-1 rounded-md">Pro</span>
                                        </div>
                                        <div className="relative w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                            {!isPro && (
                                                <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center m-1">
                                                    <a href="/dashboard/settings" className="text-xs font-bold text-black bg-[#fbbf24] px-4 py-2 rounded-lg hover:scale-105 transition-transform shadow-lg shadow-[#fbbf24]/20 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                        Upgrade to Unlock Themes
                                                    </a>
                                                </div>
                                            )}
                                            <div className="flex gap-3 px-1" style={{ width: 'max-content' }}>
                                                {PRESET_THEMES.map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => {
                                                            if (isPro) setAppearance(prev => ({ ...prev, ...(theme.appearance as any) }));
                                                        }}
                                                        className={`group relative w-32 h-24 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 shadow-md ${appearance.primary_color === theme.appearance.primary_color && appearance.theme === theme.appearance.theme ? 'border-primary shadow-primary/20 scale-105' : 'border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-black/80 to-black/40 z-10">
                                                            <div className="flex -space-x-1">
                                                                {theme.colors.map(c => (
                                                                    <div key={c} className="w-4 h-4 rounded-full border border-black shadow-sm" style={{ backgroundColor: c }} />
                                                                ))}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-white drop-shadow-md">{theme.name}</span>
                                                        </div>
                                                        <div className="absolute inset-0 opacity-50 bg-cover bg-center transition-opacity group-hover:opacity-100" style={theme.appearance.public_background_type === 'image' ? { backgroundImage: `url(${theme.appearance.public_background_image})` } : { background: theme.colors[0] }} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* GLASSMORPHISM SETTINGS (PREMIUM) */}
                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-text-primary">Glass Effect</h3>
                                                <p className="text-xs text-text-secondary mt-1">Make your card translucent.</p>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-1 rounded-md">Pro</span>
                                        </div>

                                        <div className="relative space-y-5 rounded-xl border border-white/5 p-4 bg-white/5">
                                            {!isPro && (
                                                <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-4 text-center">
                                                    <svg className="w-6 h-6 text-[#fbbf24] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                    <p className="text-xs text-white/70 mb-3">Glassmorphism is a Pro feature.</p>
                                                    <a href="/dashboard/settings" className="text-[11px] font-bold text-black bg-[#fbbf24] px-3 py-1.5 rounded-lg hover:scale-105 transition-transform shadow-lg shadow-[#fbbf24]/20">
                                                        Upgrade Plan
                                                    </a>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium text-text-secondary">Card Opacity</span>
                                                    <span className="text-xs font-mono text-primary">{appearance.card_bg_opacity ?? 100}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={appearance.card_bg_opacity ?? 100}
                                                    onChange={e => { if (isPro) setAppearance(prev => ({ ...prev, card_bg_opacity: parseInt(e.target.value) })) }}
                                                    className="w-full accent-primary h-2 bg-surface-light rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium text-text-secondary">Backdrop Blur</span>
                                                    <span className="text-xs font-mono text-primary">{appearance.card_backdrop_blur ?? 0}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="40"
                                                    value={appearance.card_backdrop_blur ?? 0}
                                                    onChange={e => { if (isPro) setAppearance(prev => ({ ...prev, card_backdrop_blur: parseInt(e.target.value) })) }}
                                                    className="w-full accent-primary h-2 bg-surface-light rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* ── Card Border ── */}
                            <AccordionItem value="card-border" className="bg-surface border border-border rounded-xl px-5 border-b-0 shadow-sm">
                                <AccordionTrigger className="hover:no-underline py-5 text-sm font-bold text-text-primary uppercase tracking-wider text-left">
                                    <div className="flex items-center gap-2">
                                        ✦ Card Border
                                        <InfoTooltip content="Add a custom border and hover glow effect to your public card." />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 space-y-6 pt-1">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-text-secondary">Border Style</label>
                                            <div className="flex bg-surface-light rounded-lg p-1 border border-border">
                                                {['none', 'solid', 'dashed', 'glow'].map(style => (
                                                    <button
                                                        key={style}
                                                        onClick={() => setAppearance(prev => ({ ...prev, card_border_style: style as any }))}
                                                        className={`px-3 py-1.5 rounded-md text-xs capitalize transition-all ${(appearance.card_border_style || 'none') === style ? 'bg-surface shadow text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
                                                    >
                                                        {style}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {appearance.card_border_style && appearance.card_border_style !== 'none' && (
                                            <div className="p-4 bg-surface-light/30 rounded-lg border border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-medium text-text-secondary">Border Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={appearance.card_border_color || appearance.primary_color || '#10B981'}
                                                            onChange={(e) => setAppearance(prev => ({ ...prev, card_border_color: e.target.value }))}
                                                            className="w-10 h-10 rounded border border-border cursor-pointer bg-transparent p-0.5"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={appearance.card_border_color || appearance.primary_color || '#10B981'}
                                                            onChange={(e) => setAppearance(prev => ({ ...prev, card_border_color: e.target.value }))}
                                                            className="flex-1 bg-surface border border-border rounded px-3 text-sm text-text-primary uppercase font-mono"
                                                            placeholder={appearance.primary_color || '#10B981'}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs text-text-secondary">
                                                        <span>Border Width</span>
                                                        <span>{appearance.card_border_width || 1}px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="8"
                                                        step="1"
                                                        value={appearance.card_border_width || 1}
                                                        onChange={e => setAppearance(prev => ({ ...prev, card_border_width: parseInt(e.target.value) }))}
                                                        className="w-full accent-primary h-1.5 bg-surface-light rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                    <div className="space-y-0.5">
                                                        <label className="text-sm font-medium text-text-secondary block">Hover Glow Effect</label>
                                                        <span className="text-xs text-text-muted">Card glows when visitor hovers</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAppearance(prev => ({ ...prev, card_border_glow: !prev.card_border_glow }))}
                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${appearance.card_border_glow ? 'bg-primary' : 'bg-surface-light border border-border'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${appearance.card_border_glow ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* ═══ SAVE BUTTON ═══ */}
                        <button
                            onClick={() => handleAppearanceSave()}
                            disabled={isSaving || isSuccess}
                            className={`btn-primary w-full mt-2 transition-all duration-300 min-w-[140px] flex items-center justify-center ${isSuccess ? 'bg-green-500 hover:bg-green-600 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''}`}
                        >
                            {isSuccess ? (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" className="animate-[draw_0.5s_ease-in-out_forwards]" style={{ strokeDasharray: 24, strokeDashoffset: 0 }} />
                                    </svg>
                                    <span className="font-bold">Saved!</span>
                                </div>
                            ) : isSaving ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                )}

            </div>

            {/* Right: Preview */}
            {
                previewOpen && (
                    <div className="hidden lg:flex flex-col items-center justify-center p-8 min-h-screen sticky top-0 h-screen w-[450px]">
                        <div className="mb-4 text-center">
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Live Preview</h3>
                            <p className="text-xs text-text-muted">Changes update in real-time</p>
                        </div>

                        {/* Mobile Frame */}
                        <div className="relative w-[340px] h-[680px] bg-black rounded-[3rem] shadow-2xl border-[8px] border-surface-dark overflow-hidden ring-4 ring-black/20">
                            {/* Screen Content */}
                            <div
                                className="w-full h-full overflow-y-auto scrollbar-hide relative transition-colors duration-500"
                                style={{
                                    background: appearance.card_background_type === 'image' && appearance.background_image
                                        ? `url(${appearance.background_image}) center/cover no-repeat`
                                        : appearance.card_background_type === 'gradient' && appearance.card_background_gradient
                                            ? appearance.card_background_gradient
                                            : hexToRgba(appearance.background_color || '#000000', cardBgOpacity),
                                    backdropFilter: cardBackdropBlur > 0 ? `blur(${cardBackdropBlur}px)` : 'none',
                                    // For Safari support
                                    WebkitBackdropFilter: cardBackdropBlur > 0 ? `blur(${cardBackdropBlur}px)` : 'none',
                                    color: dynamicTextColor,
                                    boxShadow: `0 40px 80px -12px rgba(0, 0, 0, 0.6)${cardGlow > 0 ? `, 0 0 ${cardGlow * 40}px ${appearance.primary_color}50` : ''}`,
                                    borderStyle: appearance.card_border_style && appearance.card_border_style !== 'none' && appearance.card_border_style !== 'glow' ? appearance.card_border_style : appearance.card_border_style === 'glow' ? 'solid' : 'solid',
                                    borderWidth: appearance.card_border_style && appearance.card_border_style !== 'none' ? `${appearance.card_border_width || 1}px` : '1px',
                                    borderColor: appearance.card_border_style && appearance.card_border_style !== 'none' ? (appearance.card_border_color || appearance.primary_color || '#10b981') : 'rgba(255,255,255,0.1)',
                                    '--border-color': appearance.card_border_color || appearance.primary_color || '#10b981'
                                } as React.CSSProperties}
                            >
                                {/* Emoji Background */}
                                {appearance.public_background_type === 'emoji' && Boolean(appearance.public_background_emojis) && (
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 -z-10">
                                        {(() => {
                                            const pattern = appearance.public_background_emoji_pattern || 'scatter';
                                            const emojisArr = Array.from(appearance.public_background_emojis!);
                                            if (emojisArr.length === 0) return null;
                                            if (pattern === 'grid') {
                                                return (
                                                    <div className="w-full h-full flex flex-wrap justify-center content-start py-8 gap-x-12 gap-y-12" style={{ transform: 'scale(1.2)' }}>
                                                        {Array.from({ length: 48 }).map((_, i) => (
                                                            <div key={`emoji-${i}`} className="text-4xl filter blur-[1px]">
                                                                {emojisArr[i % emojisArr.length]}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            } else if (pattern === 'floating') {
                                                const direction = appearance.public_background_emoji_direction || 'up';
                                                return (
                                                    <div className="relative w-full h-full">
                                                        {Array.from({ length: 24 }).map((_, i) => {
                                                            let style: any = {
                                                                animationDelay: `-${Math.random() * 10}s`,
                                                                animationDuration: `${10 + Math.random() * 10}s`,
                                                            };
                                                            if (direction === 'up' || direction === 'down') {
                                                                style.left = `${Math.random() * 100}%`;
                                                                style['--float-x-start'] = `${(Math.random() - 0.5) * 50}px`;
                                                                style['--float-x-end'] = `${(Math.random() - 0.5) * 100}px`;
                                                                if (direction === 'up') {
                                                                    style.bottom = '-10%';
                                                                    style['--float-y-start'] = '10vh';
                                                                    style['--float-y-end'] = '-120vh';
                                                                } else {
                                                                    style.top = '-10%';
                                                                    style['--float-y-start'] = '-10vh';
                                                                    style['--float-y-end'] = '120vh';
                                                                }
                                                            } else {
                                                                style.top = `${Math.random() * 100}%`;
                                                                style['--float-y-start'] = `${(Math.random() - 0.5) * 50}px`;
                                                                style['--float-y-end'] = `${(Math.random() - 0.5) * 100}px`;
                                                                if (direction === 'left') {
                                                                    style.right = '-10%';
                                                                    style['--float-x-start'] = '10vw';
                                                                    style['--float-x-end'] = '-120vw';
                                                                } else {
                                                                    style.left = '-10%';
                                                                    style['--float-x-start'] = '-10vw';
                                                                    style['--float-x-end'] = '120vw';
                                                                }
                                                            }
                                                            return (
                                                                <div key={`floating-emoji-${i}`} className="absolute text-5xl filter blur-[1px] animate-[float_10s_linear_infinite]" style={style}>
                                                                    {emojisArr[i % emojisArr.length]}
                                                                </div>
                                                            );
                                                        })}
                                                        <style>{`
                                                    @keyframes float {
                                                        0% { transform: translate(var(--float-x-start), var(--float-y-start)) rotate(0deg); opacity: 0; }
                                                        10% { opacity: 1; }
                                                        90% { opacity: 1; }
                                                        100% { transform: translate(var(--float-x-end), var(--float-y-end)) rotate(360deg); opacity: 0; }
                                                    }
                                                `}</style>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="w-full h-full flex flex-wrap justify-center content-start py-8 gap-x-14 gap-y-16" style={{ transform: 'scale(1.2)' }}>
                                                        {Array.from({ length: 42 }).map((_, i) => {
                                                            const rotation = (i * 47) % 360;
                                                            const offset = (i % 3 === 0) ? 'translate-y-8' : (i % 2 === 0) ? '-translate-x-6' : 'translate-x-4';
                                                            return (
                                                                <div key={`emoji-${i}`} className={`text-4xl filter blur-[1px] ${offset}`} style={{ transform: `rotate(${rotation}deg)` }}>
                                                                    {emojisArr[i % emojisArr.length]}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                )}
                                {/* Overlays */}
                                {appearance.public_background_type === 'image' && (
                                    <>
                                        {appearance.public_background_overlay > 0 && <div className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300" style={{ opacity: appearance.public_background_overlay / 100 }} />}
                                        {appearance.public_background_blur > 0 && <div className="absolute inset-0 backdrop-blur-[var(--blur)] pointer-events-none transition-all duration-300" style={{ '--blur': `${appearance.public_background_blur}px` } as any} />}
                                    </>
                                )}
                                {appearance.public_background_vignette > 0 && <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ background: `radial-gradient(circle, transparent 50%, rgba(0,0,0, ${appearance.public_background_vignette / 100}))` }} />}
                                {appearance.public_background_grain > 0 && <div className="absolute inset-0 opacity-[var(--grain)] pointer-events-none mix-blend-overlay transition-opacity duration-300" style={{ backgroundImage: 'url("/grain.png")', '--grain': appearance.public_background_grain / 100 } as any} />}

                                {/* Logo Scatter */}
                                {appearance.logo_position === 'scatter' && (
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                        {scatterPositions.map((pos, i) => (
                                            <img
                                                key={i}
                                                src={appearance.logo_url || '/logo.png'}
                                                className="absolute w-8 h-8 opacity-[var(--op)] transition-all duration-1000"
                                                style={{ top: `${pos.top}%`, left: `${pos.left}%`, transform: `rotate(${pos.rotate}deg)`, '--op': appearance.logo_opacity } as any}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Main Content */}
                                <div className="relative z-10 px-6 py-12 flex flex-col items-center gap-6 min-h-full">
                                    {/* Logo — top row positions */}
                                    {(appearance.logo_position === 'center_top' || appearance.logo_position === 'top_left' || appearance.logo_position === 'top_right') && Boolean(appearance.logo_url) && (
                                        <img
                                            src={appearance.logo_url}
                                            style={{ height: `${appearance.logo_size || 32}px` }}
                                            className={`w-auto absolute top-6 transition-all duration-500 ${appearance.logo_position === 'top_left' ? 'left-6' : appearance.logo_position === 'top_right' ? 'right-6' : 'left-1/2 -translate-x-1/2'}`}
                                        />
                                    )}

                                    {/* Logo — center hero (watermark) */}
                                    {appearance.logo_position === 'center' && Boolean(appearance.logo_url) && (
                                        <img
                                            src={appearance.logo_url}
                                            style={{ height: `${Math.max(appearance.logo_size || 32, 64)}px` }}
                                            className="w-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-0 opacity-20 pointer-events-none blur-[0.5px]"
                                        />
                                    )}

                                    {/* Logo — bottom corners */}
                                    {(appearance.logo_position === 'bottom_left' || appearance.logo_position === 'bottom_right') && Boolean(appearance.logo_url) && (
                                        <img
                                            src={appearance.logo_url}
                                            style={{ height: `${appearance.logo_size || 32}px` }}
                                            className={`w-auto absolute bottom-6 transition-all duration-500 ${appearance.logo_position === 'bottom_left' ? 'left-6' : 'right-6'}`}
                                        />
                                    )}
                                    {/* --- PROFILE HEADER BLOCKS (Layouts & Shapes) --- */}
                                    {appearance.layout === 'hero' && (
                                        <div className="absolute top-0 left-0 w-full h-32 bg-surface-dark/50 z-0">
                                            {appearance.banner_image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={appearance.banner_image_url} className="w-full h-full object-cover opacity-80" alt="Banner" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
                                            )}
                                            {/* Gradient fade to blend into background */}
                                            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t" style={{ backgroundImage: `linear-gradient(to top, ${appearance.public_background_color || appearance.background_color || '#000'}, transparent)` }} />
                                        </div>
                                    )}

                                    {/* Profile Info Block */}
                                    <div className={`relative z-10 w-full flex ${appearance.layout === 'showcase' ? 'flex-row items-center gap-5 px-4 pt-10 pb-2' : appearance.layout === 'hero' ? 'flex-col items-center mt-12' : 'flex-col items-center mt-8'}`}>
                                        
                                        {/* Avatar Container */}
                                        <div className="relative group shrink-0">
                                            <div 
                                                className="w-24 h-24 overflow-hidden border-2 border-white/20 shadow-xl relative z-10 bg-surface transition-all duration-300 group-hover:scale-105"
                                                style={{
                                                    ...(appearance.avatar_shape === 'squircle' ? { borderRadius: '25%' } : 
                                                        appearance.avatar_shape === 'hexagon' ? { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', borderRadius: '0' } :
                                                        appearance.avatar_shape === 'archway' ? { borderTopLeftRadius: '50%', borderTopRightRadius: '50%', borderBottomLeftRadius: '10%', borderBottomRightRadius: '10%' } :
                                                        appearance.avatar_shape === 'starburst' ? { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', borderRadius: '0' } :
                                                        { borderRadius: '50%' })
                                                }}
                                            >
                                                {profile?.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={profile.avatar_url} className="w-full h-full object-cover relative z-10" alt="Avatar" />
                                                ) : (
                                                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xl font-bold relative z-10">{profile?.display_name?.charAt(0) || '?'}</div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-primary/30 blur-xl scale-110 -z-0 transition-colors duration-300 pointer-events-none" style={{ backgroundColor: appearance.primary_color, borderRadius: appearance.avatar_shape === 'circle' ? '50%' : '25%' }} />
                                            
                                            {/* Auras */}
                                            {appearance.avatar_aura === 'solid' && (
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md pointer-events-none" style={{ backgroundColor: appearance.primary_color, transform: 'scale(1.3)', borderRadius: appearance.avatar_shape === 'circle' ? '50%' : '25%' }} />
                                            )}
                                            {appearance.avatar_aura === 'rainbow' && (
                                                <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg pointer-events-none animate-spin-slow" style={{ borderRadius: '50%', background: 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #0000ff, #4b0082, #ee82ee, #ff0000)' }} />
                                            )}
                                            {appearance.avatar_aura === 'pulse' && (
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500 blur-sm pointer-events-none" style={{ backgroundColor: appearance.primary_color, borderRadius: appearance.avatar_shape === 'circle' ? '50%' : '25%' }} />
                                            )}
                                        </div>

                                        {/* Text Container */}
                                        <div className={`${appearance.layout === 'showcase' ? 'text-left space-y-0.5 mt-0' : 'text-center space-y-1 mt-4'}`}>
                                            <h1 className={`${appearance.layout === 'showcase' ? 'text-2xl' : 'text-xl'} font-bold tracking-tight`} style={{ fontFamily: previewHeadingFont, ...(customHeadingColor ? { color: customHeadingColor } : {}) }}>{profile?.display_name || 'Your Name'}</h1>
                                            <p className="text-sm opacity-70" style={{ fontFamily: previewBodyFont, ...(customBodyColor ? { color: customBodyColor } : {}) }}>@{profile?.handle || 'username'}</p>
                                        </div>
                                    </div>

                                    <div className={`w-full gap-3 ${appearance.link_style === 'grid' ? 'grid grid-cols-2' : appearance.link_style === 'row' ? 'flex flex-wrap justify-center' : 'grid grid-cols-1'}`}>
                                        {links.filter(l => l.is_active).map(link => (
                                            <a
                                                key={link.id}
                                                href="#"
                                                onClick={e => e.preventDefault()}
                                                className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${appearance.card_style === 'pill' ? 'rounded-[2rem]' : appearance.card_style === 'modern' ? 'rounded-xl' : appearance.card_style === 'sharp' ? 'rounded-none' : 'rounded-lg'} ${appearance.link_style === 'row' ? 'w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md' : 'w-full p-3 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/5'} ${appearance.public_card_glow > 0 ? 'shadow-[0_0_var(--glow)_rgba(255,255,255,0.1)]' : ''} ${appearance.card_border_glow ? 'hover:shadow-[0_0_15px_var(--border-color)]' : ''}`}
                                                style={{ backgroundColor: appearance.public_card_theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)', borderColor: appearance.public_card_theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)', color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff', '--glow': `${appearance.public_card_glow}px`, '--border-color': appearance.card_border_color || appearance.primary_color || '#10B981' } as any}
                                            >
                                                {appearance.link_style === 'grid' && Boolean(link.custom_image_url) && (
                                                    <div className="absolute inset-0 z-0">
                                                        <img src={link.custom_image_url} className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-black/40" />
                                                    </div>
                                                )}
                                                {appearance.link_style === 'row' ? (
                                                    <div style={{ color: appearance.icon_style === 'color' ? undefined : 'currentColor' }}>
                                                        <SocialIcon type={link.icon} variant={appearance.icon_style === 'monochrome' ? 'monochrome' : undefined} className="w-6 h-6 relative z-10" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${appearance.icon_style === 'color' ? '' : 'text-current'}`}>
                                                            <SocialIcon type={link.icon} variant={appearance.icon_style === 'monochrome' ? 'monochrome' : undefined} className="w-6 h-6 relative z-10" />
                                                        </div>
                                                        <span className={`font-medium text-sm truncate relative z-10 flex-1 ${appearance.link_style === 'grid' ? 'text-center' : 'text-left'}`} style={{ fontFamily: previewBodyFont, ...(customBodyColor ? { color: customBodyColor } : {}) }}>{link.label}</span>
                                                        {appearance.link_style === 'list' && (
                                                            <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                        )}
                                                    </>
                                                )}
                                            </a>
                                        ))}
                                        {links.filter(l => l.is_active).length === 0 && (
                                            <div className="col-span-full text-center py-8 opacity-50 text-xs">
                                                <p>Add active links to see them here</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sponsored Products (Live Preview) */}
                                    {products.length > 0 && (
                                        <div className="w-full space-y-3 pt-4 border-t border-white/10">
                                            <h3 className="text-xs font-bold opacity-70 uppercase tracking-wider text-center" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>Featured Products</h3>
                                            <div className={`w-full gap-3 ${appearance.shop_layout === 'grid' || appearance.shop_layout === 'bento' ? 'grid grid-cols-2' : 'flex flex-col'}`}>
                                                {products.filter(p => p.is_active !== false).map(product => (
                                                    <a
                                                        key={product.id}
                                                        href="#"
                                                        onClick={e => e.preventDefault()}
                                                        className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${appearance.card_style === 'pill' ? 'rounded-[2rem]' : appearance.card_style === 'modern' ? 'rounded-xl' : appearance.card_style === 'sharp' ? 'rounded-none' : 'rounded-lg'} bg-white/10 backdrop-blur-md border border-white/5 ${appearance.public_card_glow > 0 ? 'shadow-[0_0_var(--glow)_rgba(255,255,255,0.1)]' : ''} flex ${appearance.shop_layout === 'grid' || appearance.shop_layout === 'bento' ? 'flex-col aspect-square' : 'items-center p-3 gap-3'}`}
                                                        style={{ backgroundColor: appearance.public_card_theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)', borderColor: appearance.public_card_theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)', color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff', '--glow': `${appearance.public_card_glow}px` } as any}
                                                    >
                                                        <div className={`${appearance.shop_layout === 'grid' || appearance.shop_layout === 'bento' ? 'w-full h-2/3 border-b border-white/10' : 'w-12 h-12 rounded-lg flex-shrink-0 border border-white/10'} bg-black/20 overflow-hidden relative`}>
                                                            {product.image ? (
                                                                <img src={product.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center opacity-50">
                                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                                        </div>
                                                        <div className={`${appearance.shop_layout === 'grid' || appearance.shop_layout === 'bento' ? 'p-2 flex-1 flex flex-col justify-center' : 'flex-1 min-w-0'} flex flex-col overflow-hidden`}>
                                                            <span className="font-bold text-xs truncate leading-tight w-full" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>{product.title}</span>
                                                            {product.site_name && (
                                                                <span className="text-[9px] opacity-70 truncate mt-0.5" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>{product.site_name}</span>
                                                            )}
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profile?.verified_videos && profile.verified_videos.length > 0 && (
                                        <div className="w-full space-y-3 pt-4 border-t border-white/10">
                                            <h3 className="text-xs font-bold opacity-70 uppercase tracking-wider text-center" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>Verified Videos</h3>
                                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x w-full">
                                                {profile.verified_videos.map(video => (
                                                    <a key={video.id} href={`https://youtube.com/watch?v=${video.youtube_video_id}`} target="_blank" className="min-w-[160px] max-w-[160px] snap-center rounded-lg overflow-hidden border border-white/10 group relative flex-shrink-0" style={{ backgroundColor: appearance.public_card_theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                                                        <div className="aspect-video relative">
                                                            <img src={video.thumbnail_url} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                            <div className="absolute top-1.5 right-1.5 bg-green-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                VERIFIED
                                                            </div>
                                                        </div>
                                                        <div className="p-2">
                                                            <h4 className="text-[10px] font-medium truncate leading-tight mb-1" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>{video.title}</h4>
                                                            <span className="text-[9px] opacity-60" style={{ color: appearance.public_card_theme === 'light' ? '#000000' : '#ffffff' }}>{new Date(video.published_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity group/badge cursor-help" title="This card is cryptographically signed and verified by AntiAI">
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold" style={{ color: appearance.primary_color }}>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            Securely Signed
                                        </div>
                                        <div className="flex items-center gap-2 font-mono text-[9px] text-white/50 cursor-pointer select-none" onMouseDown={() => setIsTokenRevealed(true)} onMouseUp={() => setIsTokenRevealed(false)} onMouseLeave={() => setIsTokenRevealed(false)} onTouchStart={() => setIsTokenRevealed(true)} onTouchEnd={() => setIsTokenRevealed(false)}>
                                            <span>hash:</span>
                                            <span className={`transition-colors ${isTokenRevealed ? 'text-white' : 'text-white/70 group-hover/badge:text-white'}`}>
                                                {isTokenRevealed
                                                    ? (profile?.verification_token || profile?.id || 'preview-id')
                                                    : (profile?.verification_token
                                                        ? `${profile.verification_token.substring(0, 12)}...${profile.verification_token.substring(profile.verification_token.length - 8)}`
                                                        : `0x${(profile?.id || 'preview-id').split('-')[0]}...${(profile?.id || 'preview-id').split('-').pop()}`)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
        </>
    );
}
