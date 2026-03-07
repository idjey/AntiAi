'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { SocialIcon } from '@/components/SocialIcon';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ShareDialog } from '@/components/share-dialog';

interface Props {
    creator: any;
}

export const PublicProfile = ({ creator }: Props) => {
    const { track } = useAnalytics();
    const [hasTrackedScroll, setHasTrackedScroll] = useState(false);
    const [isSocialExpanded, setIsSocialExpanded] = useState(false);

    const appearance = creator.appearance || {
        theme: 'modern_dark',
        primary_color: '#10b981',
        background_color: '#050505',
        icon_style: 'monochrome',
        link_style: 'list' as 'list' | 'grid' | 'row'
    };

    // Page Background Logic
    const pageBgType = appearance.public_background_type || 'color';
    const pageBgColor = appearance.public_background_color || '#0a0a0a';
    const pageBgGradient = appearance.public_background_gradient;
    const pageBgImage = appearance.public_background_image;
    const pageOverlay = appearance.public_background_overlay || 0;
    const pageBlur = appearance.public_background_blur || 0;
    const bgVignette = appearance.public_background_vignette || 0;
    const bgGrain = appearance.public_background_grain || 0;

    // Card Theme Logic
    const cardTheme = appearance.public_card_theme || 'dark';
    const cardGlow = appearance.public_card_glow || 0;
    const isLightMode = cardTheme === 'light';
    const cardStyle = appearance.card_style || 'modern';

    // Shape CSS Mapping
    const shapeClasses = {
        classic: { card: 'rounded-xl', link: 'rounded-lg' },
        modern: { card: 'rounded-[2.5rem]', link: 'rounded-2xl' },
        sharp: { card: 'rounded-none', link: 'rounded-none' },
        pill: { card: 'rounded-[3rem]', link: 'rounded-full' }
    };

    const currentShape = shapeClasses[cardStyle as keyof typeof shapeClasses] || shapeClasses.modern;

    // Helper: Determine stark black/white text depending on background brightness
    const getContrastYIQ = (hexcolor: string) => {
        if (!hexcolor) return '#ffffff'; // Default to white if no color
        hexcolor = hexcolor.replace('#', '');
        if (hexcolor.length === 3) {
            hexcolor = hexcolor.split('').map(char => char + char).join('');
        }
        if (hexcolor.length !== 6) return '#ffffff';
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 140) ? '#000000' : '#ffffff'; // 140 is a good threshold
    };

    // Text Colors
    const cardBgColor = appearance.background_color || '#000000';
    const dynamicTextColor = appearance.card_background_type === 'color' ? getContrastYIQ(cardBgColor) : isLightMode ? '#000000' : '#ffffff';

    // Premium Features
    const cardBgOpacity = appearance.card_bg_opacity !== undefined ? appearance.card_bg_opacity : 100;
    const cardBackdropBlur = appearance.card_backdrop_blur || 0;

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

    const [activeTab, setActiveTab] = useState<'links' | 'shop' | 'music' | 'events'>('links');
    const [isTokenRevealed, setIsTokenRevealed] = useState(false);

    // Visibility + Pinning Settings
    const tabVisibility = {
        links: appearance.tab_visibility?.links !== false,
        shop: appearance.tab_visibility?.shop !== false,
        videos: appearance.tab_visibility?.videos !== false,
        music: appearance.tab_visibility?.music !== false,
        events: appearance.tab_visibility?.events !== false
    };
    const pinnedItems = appearance.pinned_items || {
        links: null,
        shop: null,
        videos: null,
        music: null,
        events: null
    };

    // Active arrays
    const activeShopProducts = (creator.sponsored_products || []).filter((p: any) => p.is_active !== false);
    const hasShop = activeShopProducts.length > 0 && tabVisibility.shop;

    const activeLinks = (creator.links || []).filter((l: any) => l.is_active !== false);
    const hasLinks = activeLinks.length > 0 && tabVisibility.links;

    const activeMusic = (appearance.music_links || []).filter((m: any) => m.is_active !== false);
    const hasMusic = activeMusic.length > 0 && tabVisibility.music;

    const activeEvents = (appearance.events || []).filter((e: any) => e.is_active !== false);
    const hasEvents = activeEvents.length > 0 && tabVisibility.events;

    // Helper to sort pinned items to the top
    const sortPinnedFirst = (items: any[], pinnedId: string | null) => {
        if (!pinnedId || !items.length) return items;
        const pinnedList = items.filter(i => i.id === pinnedId);
        const othersList = items.filter(i => i.id !== pinnedId);
        return [...pinnedList, ...othersList];
    };

    const sortedLinks = sortPinnedFirst(activeLinks, pinnedItems.links);
    const sortedShop = sortPinnedFirst(activeShopProducts, pinnedItems.shop);
    const sortedMusic = sortPinnedFirst(activeMusic, pinnedItems.music);
    const sortedEvents = sortPinnedFirst(activeEvents, pinnedItems.events);


    const [shopTooltipVisible, setShopTooltipVisible] = useState(false);
    const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

    // Analytics Tracking & WebSockets (View, Dwell & Pulse)
    useEffect(() => {
        // Track View (Standard)
        const trackView = async () => {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/analytics/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creatorId: creator.id,
                        type: 'view',
                        entityId: creator.id,
                        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                        referer: typeof document !== 'undefined' ? document.referrer : ''
                    })
                });
            } catch (e) {
                console.error('Failed to track view', e);
            }
        };

        trackView();

        // Establish Live Pulse Socket
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/analytics`, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect_error', (err) => {
            console.warn('Socket connection error:', err.message);
        });

        // Initialize Session Dwell Timers & Scroll Trackers
        const sessionStartTime = Date.now();
        let maxScroll = 0;

        const handleScroll = () => {
            if (typeof window === 'undefined' || typeof document === 'undefined') return;
            const scrollPos = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                const currentScroll = Math.min(100, Math.round((scrollPos / docHeight) * 100));
                if (currentScroll > maxScroll) {
                    maxScroll = currentScroll;
                }
            }
        };

        const handleBeforeUnload = () => {
            const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000); // seconds

            // Execute the 'dwell' tracking payload right before tab closure
            const payload = JSON.stringify({
                creatorId: creator.id,
                type: 'dwell',
                entityId: creator.id,
                userAgent: window.navigator.userAgent,
                referer: document.referrer,
                scrollDepth: maxScroll,
                sessionDuration: sessionDuration
            });

            // Use Beacon API for reliable transmission on tab close, fallback to fetch if unavailable
            if (navigator.sendBeacon) {
                navigator.sendBeacon(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/analytics/track`, new Blob([payload], { type: 'application/json' }));
            } else {
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/analytics/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                }).catch(console.error);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup on unmount
        return () => {
            socket.disconnect();
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Also fire the dwell exit payload right here just in case it was a frontend SPA router change instead of a raw tab close
            handleBeforeUnload();
        };
    }, [creator.id]);

    const trackClick = async (linkId: string, url: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/analytics/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: creator.id,
                    type: 'click',
                    entityId: linkId,
                    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                    referer: typeof document !== 'undefined' ? document.referrer : ''
                })
            });
        } catch (e) {
            console.error('Failed to track click', e);
        }
    };
    const trackProductClick = async (productId: string, url: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/analytics/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: creator.id,
                    type: 'click',
                    entityId: productId,
                    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                    referer: typeof document !== 'undefined' ? document.referrer : ''
                })
            });
        } catch (e) {
            console.error('Failed to track product click', e);
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };
    const textColor = dynamicTextColor === '#000000' ? 'text-black' : 'text-white';
    const textSecondaryColor = dynamicTextColor === '#000000' ? 'text-gray-600' : 'text-gray-400';



    // Scatter Pattern State
    const [scatterPositions, setScatterPositions] = useState<Array<{ top: number, left: number, rotate: number }>>([]);

    useEffect(() => {
        if (appearance.logo_position === 'scatter') {
            const count = appearance.logo_count || 12;
            const style = appearance.scatter_style || 'random';
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
        }
    }, [appearance]);

    return (
        <div className="min-h-screen relative overflow-hidden font-sans">
            {/* 1. Fixed Page Background (The "World" Layer) */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center transition-colors duration-500"
                style={{
                    background: pageBgType === 'image' && pageBgImage
                        ? `url(${pageBgImage}) center/cover no-repeat`
                        : pageBgType === 'gradient' && pageBgGradient
                            ? pageBgGradient
                            : pageBgType === 'emoji'
                                ? pageBgColor
                                : pageBgColor
                }}
            >
                {/* Emoji Background for Public Page */}
                {pageBgType === 'emoji' && Boolean(appearance.public_background_emojis) && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 z-0">
                        {(() => {
                            const pattern = appearance.public_background_emoji_pattern || 'scatter';
                            const emojisString = (appearance.public_background_emojis || '') as string;
                            const emojisArr = Array.from(emojisString) as string[];
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
                                                <div
                                                    key={`floating-emoji-${i}`}
                                                    className="absolute text-5xl filter blur-[1px] animate-[float_10s_linear_infinite]"
                                                    style={style}
                                                >
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
                                // Default: scatter
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

                {/* 2. Page Overlay & Blur */}
                <div
                    className="absolute inset-0 z-10 pointer-events-none transition-all duration-500"
                    style={{
                        backgroundColor: `rgba(0,0,0,${pageOverlay / 100})`,
                        backdropFilter: `blur(${pageBlur}px)`
                    }}
                />

                {/* Vignette */}
                <div
                    className="absolute inset-0 z-20 pointer-events-none transition-all duration-500"
                    style={{
                        background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${Math.max((bgVignette || 0) + 20, 40) / 100}) 150%)`
                    }}
                />

                {/* Grain */}
                <div
                    className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                        opacity: (bgGrain || 0) / 100
                    }}
                />
            </div>

            {/* 3. Scrollable Content Wrapper */}
            <div className="relative z-10 w-full min-h-screen overflow-y-auto overflow-x-hidden py-6 px-3 flex flex-col items-center justify-center">

                {/* 4. The "Card" (Content Container) */}
                <div
                    className={`w-full max-w-[540px] relative overflow-hidden ${currentShape.card} shadow-2xl shadow-black/50 transition-all duration-500 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700 ${appearance.card_border_glow ? 'hover:shadow-[0_0_40px_var(--border-color),0_25px_50px_-12px_rgba(0,0,0,0.5)]' : ''}`}
                    style={{
                        background: appearance.card_background_type === 'image' && appearance.background_image
                            ? `url(${appearance.background_image}) center/cover no-repeat`
                            : appearance.card_background_type === 'gradient' && appearance.card_background_gradient
                                ? appearance.card_background_gradient
                                : hexToRgba(appearance.background_color || '#000000', cardBgOpacity),
                        backdropFilter: cardBackdropBlur > 0 ? `blur(${cardBackdropBlur}px)` : 'none',
                        WebkitBackdropFilter: cardBackdropBlur > 0 ? `blur(${cardBackdropBlur}px)` : 'none',
                        color: dynamicTextColor,
                        boxShadow: `0 40px 80px -12px rgba(0, 0, 0, 0.6)${cardGlow > 0 ? `, 0 0 ${cardGlow * 40}px ${appearance.primary_color}50` : ''}`,
                        borderStyle: appearance.card_border_style && appearance.card_border_style !== 'none' && appearance.card_border_style !== 'glow' ? appearance.card_border_style : appearance.card_border_style === 'glow' ? 'solid' : 'solid',
                        borderWidth: appearance.card_border_style && appearance.card_border_style !== 'none' ? `${appearance.card_border_width || 1}px` : '1px',
                        borderColor: appearance.card_border_style && appearance.card_border_style !== 'none' ? (appearance.card_border_color || appearance.primary_color || '#10b981') : 'rgba(255,255,255,0.1)',
                        '--border-color': appearance.card_border_color || appearance.primary_color || '#10b981'
                    } as React.CSSProperties}
                >
                    {/* Inner Card Overlay for Image Backgrounds to ensure text readability */}
                    {appearance.card_background_type === 'image' && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />
                    )}

                    {/* Theme Effects (Holographic) */}
                    {appearance.theme === 'holographic' && (
                        <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-tr from-purple-500/20 via-blue-500/20 to-teal-500/20 z-0" />
                    )}

                    {/* Logo/Scatter Rendering (Inside Card) */}
                    {appearance.logo_url && (
                        <>
                            {appearance.logo_position === 'scatter' ? (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                                    {scatterPositions.map((pos, i) => (
                                        <img
                                            key={i}
                                            src={appearance.logo_url}
                                            className="absolute w-24 h-24 object-contain transition-all duration-1000 ease-in-out hover:scale-110 hover:opacity-100"
                                            style={{
                                                opacity: appearance.logo_opacity || 0.2,
                                                top: `${pos.top}%`,
                                                left: `${pos.left}%`,
                                                transform: `rotate(${pos.rotate}deg)`
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className={`absolute inset-0 z-0 pointer-events-none p-6 flex w-full h-full ${appearance.logo_position === 'top_left' ? 'items-start justify-start' :
                                    appearance.logo_position === 'top_right' ? 'items-start justify-end' :
                                        appearance.logo_position === 'center_top' ? 'items-start justify-center' :
                                            appearance.logo_position === 'center' ? 'items-center justify-center' :
                                                appearance.logo_position === 'bottom_left' ? 'items-end justify-start' :
                                                    appearance.logo_position === 'bottom_right' ? 'items-end justify-end' : ''
                                    }`}>
                                    <img
                                        src={appearance.logo_url}
                                        className={`${appearance.logo_position === 'center' ? 'w-full max-w-[200px] opacity-10' : 'w-16 h-16'} object-contain`}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Share Button (Absolute Top Right) */}
                    <div className="absolute top-4 right-4 z-50">
                        <ShareDialog
                            url={typeof window !== 'undefined' ? window.location.href : `https://antiai.me/${creator.handle}`}
                            handle={creator.handle}
                            enableQr={creator.plan === 'pro' || creator.plan === 'elite'}
                            buttonClassName={`p-2 rounded-full backdrop-blur-md border transition-all hover:scale-110 active:scale-95 shadow-lg ${isLightMode ? 'bg-white/50 border-black/10 text-black hover:bg-white/80' : 'bg-black/30 border-white/10 text-white hover:bg-black/50'}`}
                            primaryColor={appearance.primary_color}
                        />
                    </div>

                    {/* Content Wrapper (Relative z-10 to stay above bg effects) */}
                    <div className="relative z-10 flex flex-col p-6 pb-8">

                        {/* Avatar & Info */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
                            }}
                            className="text-center space-y-4 mb-6"
                        >
                            {/* Avatar */}
                            <motion.div variants={{ hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { type: "spring", bounce: 0.4 } } }} className="relative mx-auto w-28 h-28 mt-4 mb-6 group">
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/20 shadow-xl relative z-10 transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: appearance.background_color }}>
                                    {creator.avatar_url ? (
                                        <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover relative z-10" />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-3xl font-bold relative z-10"
                                            style={{
                                                backgroundColor: isLightMode ? '#f3f4f6' : '#202020',
                                                color: appearance.primary_color
                                            }}
                                        >
                                            {creator.display_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Base Glow (Default) */}
                                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full scale-110 -z-0 transition-colors duration-300 pointer-events-none" style={{ backgroundColor: appearance.primary_color }} />

                                {/* Aura Effects on Hover */}
                                {appearance.avatar_aura === 'solid' && (
                                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md pointer-events-none" style={{ backgroundColor: appearance.primary_color, transform: 'scale(1.3)' }} />
                                )}
                                {appearance.avatar_aura === 'rainbow' && (
                                    <div className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg pointer-events-none animate-spin-slow" style={{ background: 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #0000ff, #4b0082, #ee82ee, #ff0000)' }} />
                                )}
                                {appearance.avatar_aura === 'pulse' && (
                                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500 blur-sm pointer-events-none" style={{ backgroundColor: appearance.primary_color }} />
                                )}
                            </motion.div>

                            {/* Name & Handle */}
                            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                                <h1 className="text-2xl font-bold flex items-center justify-center gap-2 drop-shadow-lg leading-tight">
                                    {creator.display_name}
                                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: appearance.primary_color }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                </h1>
                                <p className={`text-sm ${textSecondaryColor} mt-1 font-medium opacity-80`}>@{creator.handle}</p>
                            </motion.div>

                            {/* Bio */}
                            {creator.bio && (
                                <motion.p variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className={`${textSecondaryColor} px-2 text-sm leading-relaxed whitespace-pre-wrap opacity-90`}>
                                    {creator.bio}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Tab Bar: Links / Shop / Music / Events */}
                        <div className="flex gap-1 mb-4 p-1 rounded-full border border-white/10 bg-white/5 flex-wrap overflow-hidden">
                            {tabVisibility.links !== false && (
                                <motion.button
                                    key="tab-links"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveTab('links')}
                                    className={`relative flex-1 min-w-[60px] py-2 px-3 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${activeTab === 'links'
                                        ? 'text-black'
                                        : `${textSecondaryColor} hover:text-white`
                                        }`}
                                >
                                    {activeTab === 'links' && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 rounded-full shadow-md z-0"
                                            style={{ backgroundColor: appearance.primary_color }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">Links</span>
                                </motion.button>
                            )}
                            {hasShop && (
                                <motion.button
                                    key="tab-shop"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveTab('shop')}
                                    className={`relative flex-1 min-w-[60px] py-2 px-3 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${activeTab === 'shop'
                                        ? 'text-black'
                                        : `${textSecondaryColor} hover:text-white`
                                        }`}
                                >
                                    {activeTab === 'shop' && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 rounded-full shadow-md z-0"
                                            style={{ backgroundColor: appearance.primary_color }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">Shop</span>
                                </motion.button>
                            )}
                            {hasMusic && (
                                <motion.button
                                    key="tab-music"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveTab('music')}
                                    className={`relative flex-1 min-w-[60px] py-2 px-3 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${activeTab === 'music'
                                        ? 'text-black'
                                        : `${textSecondaryColor} hover:text-white`
                                        }`}
                                >
                                    {activeTab === 'music' && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 rounded-full shadow-md z-0"
                                            style={{ backgroundColor: appearance.primary_color }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">Music</span>
                                </motion.button>
                            )}
                            {hasEvents && (
                                <motion.button
                                    key="tab-events"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveTab('events')}
                                    className={`relative flex-1 min-w-[60px] py-2 px-3 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${activeTab === 'events'
                                        ? 'text-black'
                                        : `${textSecondaryColor} hover:text-white`
                                        }`}
                                >
                                    {activeTab === 'events' && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 rounded-full shadow-md z-0"
                                            style={{ backgroundColor: appearance.primary_color }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">Events</span>
                                </motion.button>
                            )}
                        </div>

                        {/* Tab Content Area */}
                        <div className="relative w-full">
                            <AnimatePresence mode="wait">
                                {/* Links Tab */}
                                {activeTab === 'links' && (
                                    <motion.div
                                        key="links"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full relative"
                                    >
                                        {/* Scrollable wrapper for list/grid when >4 links */}
                                        <div
                                            className={`${creator.links.length > 4 && appearance.link_style !== 'row' ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : ''}`}
                                            style={{
                                                maxHeight: creator.links.length > 4 && appearance.link_style !== 'row'
                                                    ? (appearance.link_style === 'grid' ? '320px' : '280px')
                                                    : undefined
                                            }}
                                        >
                                            <motion.div
                                                className={
                                                    appearance.link_style === 'grid' ? "grid grid-cols-2 gap-2 w-full" :
                                                        appearance.link_style === 'row' ? "flex flex-wrap justify-center gap-3 w-full" :
                                                            "space-y-2 w-full"
                                                }
                                                initial="hidden"
                                                animate="visible"
                                                variants={{
                                                    hidden: {},
                                                    visible: { transition: { staggerChildren: 0.1 } }
                                                }}
                                            >
                                                {(appearance.link_style === 'row' && !isSocialExpanded && sortedLinks.length > 4
                                                    ? sortedLinks.slice(0, 4)
                                                    : sortedLinks
                                                ).map((link: any, i: number) => {
                                                    const isPinned = pinnedItems.links === link.id;
                                                    return (
                                                        <motion.a
                                                            key={link.id}
                                                            variants={{
                                                                hidden: { opacity: 0, y: 15 },
                                                                visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
                                                            }}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={() => trackClick(link.id, link.url)}
                                                            className={`
                                                block border ${currentShape.link} group relative overflow-hidden transition-all duration-300 ${appearance.card_style === 'pill' ? 'rounded-[2rem]' : ''} backdrop-blur-sm shadow-sm hover:shadow-md
                                                ${appearance.link_style === 'row'
                                                                    ? 'p-3 w-12 h-12 flex items-center justify-center'
                                                                    : appearance.link_style === 'grid'
                                                                        ? 'w-full p-4 flex flex-col justify-center text-center aspect-square gap-4'
                                                                        : 'w-full p-4 flex items-center gap-4'
                                                                }
                                                ${appearance.card_border_glow ? 'hover:shadow-[0_0_15px_var(--border-color)]' : ''}
                                                ${isPinned ? 'ring-2 ring-primary border-transparent' : ''}
                                            `}
                                                            style={{
                                                                backgroundColor: isLightMode ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.08)',
                                                                borderColor: isPinned ? appearance.primary_color : `${appearance.primary_color}30`,
                                                                '--border-color': appearance.card_border_color || appearance.primary_color || '#10B981',
                                                                minWidth: appearance.link_style === 'row' ? '44px' : undefined,
                                                                minHeight: appearance.link_style === 'row' ? '44px' : undefined
                                                            } as any}
                                                            aria-label={link.label}
                                                            title={appearance.link_style === 'row' ? link.label : undefined}
                                                        >
                                                            {/* Grid mode: faint platform logo background */}
                                                            {appearance.link_style === 'grid' && link.url && (() => {
                                                                try {
                                                                    const domain = new URL(link.url).hostname;
                                                                    return (
                                                                        <img
                                                                            src={`https://logo.clearbit.com/${domain}`}
                                                                            alt=""
                                                                            className="absolute inset-0 w-full h-full object-contain p-6 opacity-[0.08] pointer-events-none blur-[1px] group-hover:opacity-[0.15] transition-opacity duration-500"
                                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                        />
                                                                    );
                                                                } catch { return null; }
                                                            })()}

                                                            <div className={`absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity ${isLightMode ? 'bg-black/5' : 'bg-white/10'}`} />
                                                            {/* Hover glow */}
                                                            <div
                                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                                style={{ background: `radial-gradient(circle at center, ${appearance.primary_color}15, transparent 70%)` }}
                                                            />

                                                            {isPinned && appearance.link_style !== 'row' && (
                                                                <div className="absolute top-2 right-2 rotate-45 pointer-events-none z-20">
                                                                    <span className="drop-shadow-md">📌</span>
                                                                </div>
                                                            )}

                                                            <div className="relative z-10 transition-transform duration-300">
                                                                <div className={appearance.link_style === 'grid' ? "w-8 h-8 mx-auto mb-2 flex items-center justify-center relative" : "w-6 h-6 flex items-center justify-center relative"}>
                                                                    <SocialIcon
                                                                        type={link.icon}
                                                                        url={link.url}
                                                                        variant={appearance.icon_style}
                                                                        className={isLightMode && appearance.icon_style === 'monochrome' ? 'text-black' : ''}
                                                                    />
                                                                    {isPinned && appearance.link_style === 'row' && (
                                                                        <div className="absolute -top-3 -right-3 rotate-45 pointer-events-none z-20 text-xs">📌</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {appearance.link_style !== 'row' && (
                                                                <span className={`font-medium ${appearance.link_style === 'grid' ? 'text-xs' : 'text-center flex-1 pr-10'} relative z-10`}>{link.label}</span>
                                                            )}
                                                        </motion.a>
                                                    );
                                                })}

                                                {/* Expand Toggle for Social Row */}
                                                {appearance.link_style === 'row' && sortedLinks.length > 4 && (
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setIsSocialExpanded(!isSocialExpanded)}
                                                        className={`
                                                border ${currentShape.link} transition-all hover:scale-105 active:scale-90 group backdrop-blur-sm relative overflow-hidden shadow-sm hover:shadow-md
                                                p-3 w-12 h-12 flex items-center justify-center
                                            `}
                                                        style={{
                                                            backgroundColor: isLightMode ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.08)',
                                                            borderColor: `${appearance.primary_color}30`,
                                                            minWidth: '44px',
                                                            minHeight: '44px'
                                                        }}
                                                        aria-label={isSocialExpanded ? "Collapse links" : "Show all links"}
                                                    >
                                                        <div className={`absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity ${isLightMode ? 'bg-black/5' : 'bg-white/10'}`} />
                                                        <svg
                                                            className={`w-5 h-5 transition-transform duration-300 ${isSocialExpanded ? 'rotate-180' : ''}`}
                                                            style={{ color: appearance.primary_color }}
                                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </motion.button>
                                                )}
                                                {creator.links.length === 0 && (
                                                    <div className={`col-span-full text-center text-sm ${textSecondaryColor} py-4 opacity-50`}>
                                                        No links available.
                                                    </div>
                                                )}
                                            </motion.div>
                                        </div>

                                        {/* Gradient fade hint when scrollable */}
                                        {creator.links.length > 4 && appearance.link_style !== 'row' && (
                                            <div
                                                className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none z-20"
                                                style={{
                                                    background: `linear-gradient(to top, ${appearance.background_color || '#000'}, transparent)`
                                                }}
                                            />
                                        )}
                                    </motion.div>
                                )}

                                {/* Shop Tab */}
                                {activeTab === 'shop' && hasShop && (
                                    <motion.div
                                        key="shop"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full space-y-3"
                                    >
                                        {/* Section header with disclaimer */}
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className={`text-xs font-bold ${textSecondaryColor} uppercase tracking-widest opacity-70`}>Sponsored Products</h2>
                                            <div className="relative">
                                                <button
                                                    onMouseEnter={() => setShopTooltipVisible(true)}
                                                    onMouseLeave={() => setShopTooltipVisible(false)}
                                                    onClick={() => setShopTooltipVisible(!shopTooltipVisible)}
                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors ${textSecondaryColor} border-current opacity-50 hover:opacity-100`}
                                                    aria-label="Affiliate disclaimer"
                                                >
                                                    i
                                                </button>
                                                {shopTooltipVisible && (
                                                    <div className="absolute bottom-full right-0 mb-2 w-60 p-3 bg-black/90 border border-white/10 rounded-xl text-xs text-white/70 shadow-2xl z-50 leading-relaxed">
                                                        Products promoted here are chosen by this creator. AntiAI is not affiliated with and bears no responsibility for third-party products, their accuracy, or their sellers.
                                                        <div className="absolute top-full right-3 border-[6px] border-transparent border-t-black/90" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Shop Layout Container */}
                                        <motion.div
                                            className={`gap-3 ${sortedShop.length > 4 ? 'overflow-y-auto pr-1 pb-1 -mr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : ''} ${appearance.shop_layout === 'grid' || appearance.shop_layout === 'bento' ? 'grid grid-cols-2' : 'flex flex-col'}`}
                                            style={{ maxHeight: sortedShop.length > 4 ? '480px' : undefined }}
                                            initial="hidden"
                                            animate="visible"
                                            variants={{
                                                hidden: {},
                                                visible: { transition: { staggerChildren: 0.1 } }
                                            }}
                                        >
                                            {sortedShop.map((product: any, i: number) => {
                                                const isGrid = appearance.shop_layout === 'grid';
                                                const isBentoHero = appearance.shop_layout === 'bento' && i === 0;
                                                const isBentoThumb = appearance.shop_layout === 'bento' && i !== 0;

                                                const isHorizontal = !isGrid && !isBentoThumb; // List or Bento Hero
                                                const isVertical = isGrid || isBentoThumb;

                                                const isPinned = pinnedItems.shop === product.id;

                                                return (
                                                    <motion.button
                                                        key={product.id || i}
                                                        variants={{
                                                            hidden: { opacity: 0, y: 15 },
                                                            visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
                                                        }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => trackProductClick(product.id, product.url)}
                                                        className={`group flex text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg w-full
                                                    ${isHorizontal ? 'flex-row items-stretch' : 'flex-col'}
                                                    ${isBentoHero ? 'col-span-2' : ''}
                                                    ${isPinned ? 'ring-2 ring-primary border-transparent' : ''}
                                                `}
                                                        style={{
                                                            borderColor: isPinned ? appearance.primary_color : `${appearance.primary_color}30`,
                                                            backgroundColor: isLightMode ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.04)'
                                                        }}
                                                        aria-label={`Shop: ${product.title}`}
                                                    >
                                                        {/* Product Image */}
                                                        <div
                                                            className={`shrink-0 relative overflow-hidden bg-white/5 
                                                        ${isHorizontal ? 'w-28 sm:w-36 min-h-[112px] border-r' : 'w-full aspect-[4/3] border-b'}
                                                    `}
                                                            style={{ borderColor: `${appearance.primary_color}20` }}
                                                        >
                                                            {isPinned && (
                                                                <div className="absolute top-1 left-1 rotate-45 pointer-events-none z-20 drop-shadow-md text-sm">
                                                                    📌
                                                                </div>
                                                            )}
                                                            {product.image ? (
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.title}
                                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    loading="lazy"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            {/* Hover glow */}
                                                            <div
                                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                                style={{ background: `radial-gradient(circle at center, ${appearance.primary_color}20, transparent 70%)` }}
                                                            />
                                                        </div>

                                                        {/* Product Info */}
                                                        <div className={`p-3 sm:p-4 flex-1 min-w-0 flex flex-col justify-center ${isVertical ? 'pb-4' : ''}`}>
                                                            {product.site_name && (
                                                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 block mb-1.5 line-clamp-1" style={{ color: appearance.primary_color }}>
                                                                    {product.site_name}
                                                                </span>
                                                            )}
                                                            <p className={`text-sm font-semibold ${textColor} ${isVertical ? 'line-clamp-2' : 'line-clamp-2'} leading-tight mb-3`}>
                                                                {product.title}
                                                            </p>
                                                            <div
                                                                className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full w-fit transition-all group-hover:shadow-md mt-auto"
                                                                style={{ backgroundColor: `${appearance.primary_color}25`, color: appearance.primary_color }}
                                                            >
                                                                Shop Now
                                                                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </motion.div>
                                    </motion.div>
                                )}
                                {/* Music Tab */}
                                {activeTab === 'music' && hasMusic && (
                                    <motion.div
                                        key="music"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full space-y-4 pt-2"
                                    >
                                        <motion.div
                                            className={`gap-3 flex flex-col ${sortedMusic.length > 3 ? 'overflow-y-auto pr-1 pb-1 -mr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : ''}`}
                                            style={{ maxHeight: sortedMusic.length > 3 ? '480px' : undefined }}
                                            initial="hidden"
                                            animate="visible"
                                            variants={{
                                                hidden: {},
                                                visible: { transition: { staggerChildren: 0.1 } }
                                            }}
                                        >
                                            {sortedMusic.map((music: any, i: number) => {
                                                const isPinned = pinnedItems.music === music.id;

                                                // Extract embeds
                                                const getSpotifyEmbed = (url: string) => {
                                                    const match = url.match(/spotify\.com\/(track|album)\/([a-zA-Z0-9]+)/);
                                                    if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
                                                    return null;
                                                };
                                                const getAppleEmbed = (url: string) => {
                                                    const match = url.match(/music\.apple\.com\/[a-z]{2}\/album\/[^/]+\/([0-9]+)\?i=([0-9]+)/) || url.match(/music\.apple\.com\/[a-z]{2}\/album\/[^/]+\/([0-9]+)/);
                                                    if (match && match[2]) return `https://embed.music.apple.com/us/album/embed/${match[1]}?i=${match[2]}`;
                                                    if (match && match[1]) return `https://embed.music.apple.com/us/album/embed/${match[1]}`;
                                                    return null;
                                                };
                                                const getSoundcloudEmbed = (url: string) => {
                                                    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23${appearance.primary_color.replace('#', '')}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
                                                };

                                                const platformUrl = music.url || '';
                                                let iframeEmbed = null;
                                                let embedHeight = 152; // Default 152

                                                if (platformUrl.includes('spotify.com')) {
                                                    iframeEmbed = getSpotifyEmbed(platformUrl);
                                                } else if (platformUrl.includes('apple.com')) {
                                                    iframeEmbed = getAppleEmbed(platformUrl);
                                                    embedHeight = 150;
                                                } else if (platformUrl.includes('soundcloud.com')) {
                                                    iframeEmbed = getSoundcloudEmbed(platformUrl);
                                                }

                                                return (
                                                    <motion.div
                                                        key={music.id || i}
                                                        variants={{
                                                            hidden: { opacity: 0, y: 15 },
                                                            visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
                                                        }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={!iframeEmbed ? { scale: 0.97 } : {}}
                                                        className={`group flex flex-col text-left rounded-2xl overflow-hidden border transition-all duration-300 w-full hover:shadow-lg
                                                            ${isPinned ? 'ring-2 ring-primary border-transparent' : ''}
                                                            `}
                                                        style={{
                                                            borderColor: isPinned ? appearance.primary_color : `${appearance.primary_color}30`,
                                                            backgroundColor: isLightMode ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.04)'
                                                        }}
                                                    >
                                                        {iframeEmbed ? (
                                                            <div className="relative w-full overflow-hidden" style={{ minHeight: `${embedHeight}px` }}>
                                                                {isPinned && (
                                                                    <div className="absolute top-2 right-2 rotate-45 pointer-events-none z-20 text-xl drop-shadow-md">📌</div>
                                                                )}
                                                                <iframe
                                                                    src={iframeEmbed}
                                                                    width="100%"
                                                                    height={embedHeight}
                                                                    frameBorder="0"
                                                                    allowFullScreen
                                                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                                    loading="lazy"
                                                                    className="relative z-10 w-full rounded-t-xl"
                                                                ></iframe>
                                                            </div>
                                                        ) : (
                                                            <a
                                                                href={music.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-4 flex flex-col justify-center relative min-h-[100px]"
                                                                onClick={() => trackClick(music.id, music.url)}
                                                            >
                                                                {isPinned && (
                                                                    <div className="absolute top-2 right-2 rotate-45 pointer-events-none z-20 text-xl drop-shadow-md">📌</div>
                                                                )}
                                                                <h3 className={`text-base font-semibold ${textColor} line-clamp-1`}>{music.title}</h3>
                                                                <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest mt-2" style={{ color: appearance.primary_color }}>
                                                                    <span className="opacity-70">{music.platform || 'Listen'}</span>
                                                                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                                                                    </svg>
                                                                </div>
                                                            </a>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Events Tab */}
                                {activeTab === 'events' && hasEvents && (
                                    <motion.div
                                        key="events"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full space-y-4 pt-2"
                                    >
                                        <motion.div
                                            className={`gap-4 flex flex-col ${sortedEvents.length > 4 ? 'overflow-y-auto pr-1 pb-1 -mr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent' : ''}`}
                                            style={{ maxHeight: sortedEvents.length > 4 ? '480px' : undefined }}
                                            initial="hidden"
                                            animate="visible"
                                            variants={{
                                                hidden: {},
                                                visible: { transition: { staggerChildren: 0.1 } }
                                            }}
                                        >
                                            {sortedEvents.map((event: any, i: number) => {
                                                const isPinned = pinnedItems.events === event.id;
                                                const eventDate = event.date ? new Date(event.date) : null;
                                                const mapEmbedUrl = event.venue ? `https://www.google.com/maps?q=${encodeURIComponent(event.venue)}&output=embed` : null;

                                                return (
                                                    <motion.div
                                                        key={event.id || i}
                                                        variants={{
                                                            hidden: { opacity: 0, y: 15 },
                                                            visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
                                                        }}
                                                        className={`group flex flex-col text-left rounded-2xl overflow-hidden border transition-all duration-300 w-full hover:shadow-lg
                                                            ${isPinned ? 'ring-2 ring-primary border-transparent' : ''}
                                                            `}
                                                        style={{
                                                            borderColor: isPinned ? appearance.primary_color : `${appearance.primary_color}30`,
                                                            backgroundColor: isLightMode ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.04)'
                                                        }}
                                                    >
                                                        {mapEmbedUrl && expandedMapId === event.id && (
                                                            <div className="relative w-full h-48 overflow-hidden bg-black/10 border-b border-black/5 animate-in slide-in-from-top-2">
                                                                <iframe
                                                                    width="100%"
                                                                    height="100%"
                                                                    frameBorder="0"
                                                                    style={{ border: 0 }}
                                                                    src={mapEmbedUrl}
                                                                    allowFullScreen
                                                                    className="opacity-80 group-hover:opacity-100 transition-opacity"
                                                                ></iframe>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setExpandedMapId(null);
                                                                    }}
                                                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors text-xs z-30"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="p-4 flex gap-4 w-full relative">
                                                            {isPinned && (!mapEmbedUrl || expandedMapId !== event.id) && (
                                                                <div className="absolute top-3 right-3 rotate-45 pointer-events-none z-20 text-lg drop-shadow-md">📌</div>
                                                            )}
                                                            {/* Date Box */}
                                                            {eventDate && (
                                                                <div className={`flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-xl shadow-md border`} style={{ borderColor: `${appearance.primary_color}40`, backgroundColor: isLightMode ? 'white' : 'rgba(0,0,0,0.4)' }}>
                                                                    <span className="text-[10px] uppercase font-bold" style={{ color: appearance.primary_color }}>
                                                                        {eventDate.toLocaleString('default', { month: 'short' })}
                                                                    </span>
                                                                    <span className={`text-xl font-black ${textColor}`}>
                                                                        {eventDate.getDate()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {/* Content */}
                                                            <div className="flex-1 flex flex-col min-w-0 pr-4">
                                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                                    {event.ticket_url && (
                                                                        <a
                                                                            href={event.ticket_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={() => trackClick(event.id, event.ticket_url)}
                                                                            className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full w-fit hover:scale-105 transition-transform shadow-sm hover:shadow-md"
                                                                            style={{ backgroundColor: `${appearance.primary_color}`, color: '#000' }}
                                                                        >
                                                                            Get Tickets
                                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                                            </svg>
                                                                        </a>
                                                                    )}
                                                                    {mapEmbedUrl && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                setExpandedMapId(expandedMapId === event.id ? null : event.id);
                                                                            }}
                                                                            className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full w-fit hover:scale-105 transition-all shadow-sm hover:shadow-md border"
                                                                            style={{
                                                                                borderColor: expandedMapId === event.id ? appearance.primary_color : `${appearance.primary_color}40`,
                                                                                backgroundColor: expandedMapId === event.id ? `${appearance.primary_color}20` : isLightMode ? 'white' : 'rgba(0,0,0,0.2)',
                                                                                color: expandedMapId === event.id ? appearance.primary_color : textColor
                                                                            }}
                                                                        >
                                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            </svg>
                                                                            {expandedMapId === event.id ? 'Hide Map' : 'Location'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Featured / Verifications ONLY on Links Tab now */}
                                {activeTab === 'links' && creator.featured_video && tabVisibility.videos !== false && (
                                    <div className="space-y-3 pt-6 w-full">
                                        <h2 className={`text-xs font-bold ${textSecondaryColor} uppercase tracking-widest text-center opacity-70`}>Featured Verification</h2>
                                        <div
                                            className={`bg-surface border ${currentShape.link} overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/20 backdrop-blur-sm group`}
                                            style={{ borderColor: `${appearance.primary_color}40` }}
                                        >
                                            <div className="aspect-video relative bg-black group-hover:opacity-90 transition-opacity">
                                                <img src={creator.featured_video.thumbnail_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg" style={{ backgroundColor: appearance.primary_color }}>
                                                        <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                </div>
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1">
                                                    <svg className="w-3 h-3" style={{ color: appearance.primary_color }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                    <span className="text-xs font-medium text-white">Verified</span>
                                                </div>
                                            </div>
                                            <div className="p-4" style={{ backgroundColor: isLightMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.4)' }}>
                                                <h3 className={`font-bold line-clamp-1 ${textColor}`}>{creator.featured_video.title}</h3>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className={`text-xs ${textSecondaryColor}`}>Authenticity Verified</span>
                                                    <Link href={`/verify/${creator.featured_video.youtube_video_id}`} className="text-xs hover:underline font-medium flex items-center gap-1" style={{ color: appearance.primary_color }}>
                                                        View Certificate <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Verified Videos Section */}
                                {activeTab === 'links' && creator.verified_videos && creator.verified_videos.length > 0 && tabVisibility.videos !== false && (
                                    <div className="space-y-2 pt-4 w-full">
                                        <h2 className={`text-xs font-bold ${textSecondaryColor} uppercase tracking-widest text-center opacity-70`}>Verified Videos</h2>

                                        {/* Edge Case: 1 Video (Center, no scroll) */}
                                        {creator.verified_videos.length === 1 ? (
                                            <div className="px-2">
                                                <div
                                                    className={`aspect-video bg-black/20 overflow-hidden ${currentShape.link} border relative group transition-all hover:shadow-lg cursor-pointer`}
                                                    style={{ borderColor: `${appearance.primary_color}20` }}
                                                    onClick={() => track('video_click', {
                                                        video_id: creator.verified_videos[0].id,
                                                        video_title: creator.verified_videos[0].title,
                                                        source: 'verified_list_single'
                                                    })}
                                                >
                                                    <img src={creator.verified_videos[0].thumbnail_url} alt={creator.verified_videos[0].title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1">
                                                        <svg className="w-3 h-3" style={{ color: appearance.primary_color }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                        <span className="text-xs font-bold text-white uppercase tracking-wider">Verified</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Vertical List (Full Width - Scrollable) */
                                            <div className="relative group/list">
                                                <div
                                                    className="flex flex-col space-y-4 pb-4 overflow-y-auto pr-1"
                                                    style={{
                                                        maxHeight: '300px',
                                                        scrollbarWidth: 'thin',
                                                        scrollbarColor: `${appearance.primary_color}40 transparent`
                                                    }}
                                                >
                                                    {creator.verified_videos.map((video: any, i: number) => (
                                                        <a
                                                            key={video.id || i}
                                                            href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`block w-full aspect-video bg-black/20 overflow-hidden ${currentShape.link} border relative group transition-all hover:shadow-lg cursor-pointer shrink-0`}
                                                            style={{ borderColor: `${appearance.primary_color}20` }}
                                                            onClick={() => track('video_click', {
                                                                video_id: video.id,
                                                                video_title: video.title,
                                                                source: 'verified_list_vertical'
                                                            })}
                                                        >
                                                            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" loading="lazy" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1">
                                                                <svg className="w-3 h-3" style={{ color: appearance.primary_color }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                            </div>
                                                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <p className="text-white text-sm font-medium line-clamp-1">{video.title}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                                {/* Bottom Scroll Cue Gradient */}
                                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/10 to-transparent pointer-events-none opacity-0 group-hover/list:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Secure Badge */}
                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity group/badge cursor-help" title="This card is cryptographically signed and verified by AntiAI">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold" style={{ color: appearance.primary_color }}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Securely Signed
                            </div>
                            <div
                                className="flex items-center gap-2 font-mono text-[9px] text-white/50 cursor-pointer select-none"
                                onMouseDown={() => setIsTokenRevealed(true)}
                                onMouseUp={() => setIsTokenRevealed(false)}
                                onMouseLeave={() => setIsTokenRevealed(false)}
                                onTouchStart={() => setIsTokenRevealed(true)}
                                onTouchEnd={() => setIsTokenRevealed(false)}
                            >
                                <span>hash:</span>
                                <span className={`transition-colors ${isTokenRevealed ? 'text-white' : 'text-white/70 group-hover/badge:text-white'}`}>
                                    {isTokenRevealed
                                        ? (creator.verification_token || creator.id)
                                        : (creator.verification_token
                                            ? `${creator.verification_token.substring(0, 12)}...${creator.verification_token.substring(creator.verification_token.length - 8)}`
                                            : `0x${creator.id?.split('-')[0]}...${creator.id?.split('-').pop()}`)}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-auto pb-2">
                            <Link href="/" className={`inline-flex items-center gap-2 ${textSecondaryColor} hover:opacity-100 transition-opacity opacity-50`}>
                                <span className="text-xs font-medium">Verified by</span>
                                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">AntiAI</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* External Extension CTA */}
                <div className="w-full max-w-md mt-8 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <a
                        href="https://antiai.me/extension"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-col items-center group"
                    >
                        <div className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-6 py-3 rounded-full font-bold transition-all transform group-hover:scale-105 group-hover:shadow-lg shadow-primary/10">
                            Download AntiAI Extension
                        </div>
                        <p className="mt-3 text-xs font-medium opacity-60 group-hover:opacity-100 transition-opacity text-white flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                            Used by creators to prove authenticity
                        </p>
                    </a>
                </div>
            </div>
        </div >
    );
};
