'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SocialIcon } from '@/components/SocialIcon';
import { useAnalytics } from '@/hooks/useAnalytics';

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

    // Text Colors derived from Card Theme
    const textColor = isLightMode ? 'text-black' : 'text-white';
    const textSecondaryColor = isLightMode ? 'text-gray-600' : 'text-gray-400';



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
                            : pageBgColor
                }}
            >
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
                    className={`w-full max-w-md relative overflow-hidden ${currentShape.card} shadow-2xl border border-white/10 transition-all duration-500 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700`}
                    style={{
                        backgroundColor: appearance.background_color, // Inner Card Color
                        color: isLightMode ? '#000000' : '#ffffff',
                        boxShadow: `0 40px 80px -12px rgba(0, 0, 0, 0.6)${cardGlow > 0 ? `, 0 0 ${cardGlow * 40}px ${appearance.primary_color}50` : ''}`
                    }}
                >
                    {/* Inner Card Background Image (Legacy/Specific) */}
                    {appearance.background_image && (
                        <div
                            className="absolute inset-0 bg-cover bg-center z-0 animate-in fade-in duration-1000"
                            style={{ backgroundImage: `url(${appearance.background_image})` }}
                        >
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                        </div>
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

                    {/* Content Wrapper (Relative z-10 to stay above bg effects) */}
                    <div className="relative z-10 flex flex-col p-6 pb-8">

                        {/* Avatar & Info */}
                        <div className="text-center space-y-4 mb-6">
                            {/* Avatar */}
                            {/* Avatar */}
                            <div
                                className="mx-auto w-28 h-28 rounded-full p-1 animate-pulse-glow"
                                style={{
                                    background: `linear-gradient(to bottom right, ${appearance.primary_color}, ${appearance.primary_color}40)`,
                                    '--pulse-color': `${appearance.primary_color}60`
                                } as React.CSSProperties}
                            >
                                <div className="w-full h-full rounded-full overflow-hidden bg-surface border-4" style={{ borderColor: appearance.background_color }}>
                                    {creator.avatar_url ? (
                                        <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-3xl font-bold"
                                            style={{
                                                backgroundColor: isLightMode ? '#f3f4f6' : '#202020',
                                                color: appearance.primary_color
                                            }}
                                        >
                                            {creator.display_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Name & Handle */}
                            <div>
                                <h1 className="text-2xl font-bold flex items-center justify-center gap-2 drop-shadow-lg leading-tight">
                                    {creator.display_name}
                                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: appearance.primary_color }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                </h1>
                                <p className={`text-sm ${textSecondaryColor} mt-1 font-medium opacity-80`}>@{creator.handle}</p>
                            </div>

                            {/* Bio */}
                            {creator.bio && (
                                <p className={`${textSecondaryColor} px-2 text-sm leading-relaxed whitespace-pre-wrap opacity-90`}>
                                    {creator.bio}
                                </p>
                            )}
                        </div>

                        {/* Links */}
                        <div className={
                            appearance.link_style === 'grid' ? "grid grid-cols-2 gap-2 w-full" :
                                appearance.link_style === 'row' ? "flex flex-wrap justify-center gap-3 w-full" :
                                    "space-y-2 w-full"
                        }>
                            {(appearance.link_style === 'row' && !isSocialExpanded && creator.links.length > 4
                                ? creator.links.slice(0, 4)
                                : creator.links
                            ).map((link: any, i: number) => (
                                <a
                                    key={link.id || i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`
                                        block border ${currentShape.link} transition-all hover:scale-105 active:scale-90 group backdrop-blur-sm relative overflow-hidden shadow-sm hover:shadow-md
                                        ${appearance.link_style === 'row'
                                            ? 'p-3 w-12 h-12 flex items-center justify-center'
                                            : appearance.link_style === 'grid'
                                                ? 'w-full p-4 flex flex-col justify-center text-center aspect-square gap-4'
                                                : 'w-full p-4 flex items-center gap-4'
                                        }
                                    `}
                                    style={{
                                        backgroundColor: isLightMode ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.08)',
                                        borderColor: `${appearance.primary_color}30`,
                                        animationDelay: `${i * 100}ms`,
                                        minWidth: appearance.link_style === 'row' ? '44px' : undefined,
                                        minHeight: appearance.link_style === 'row' ? '44px' : undefined
                                    }}
                                    aria-label={link.label}
                                    title={appearance.link_style === 'row' ? link.label : undefined}
                                    onClick={() => track('link_click', {
                                        link_id: link.id,
                                        link_type: link.icon,
                                        link_style: appearance.link_style
                                    })}
                                >
                                    <div className={`absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity ${isLightMode ? 'bg-black/5' : 'bg-white/10'}`} />
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10 transition-transform duration-300">
                                        <div className={appearance.link_style === 'grid' ? "w-8 h-8 mx-auto mb-2 flex items-center justify-center" : "w-6 h-6 flex items-center justify-center"}>
                                            <SocialIcon
                                                type={link.icon}
                                                url={link.url}
                                                variant={appearance.icon_style}
                                                className={isLightMode && appearance.icon_style === 'monochrome' ? 'text-black' : ''}
                                            />
                                        </div>
                                    </div>
                                    {appearance.link_style !== 'row' && (
                                        <span className={`font-medium ${appearance.link_style === 'grid' ? 'text-xs' : 'text-center flex-1 pr-10'} relative z-10`}>{link.label}</span>
                                    )}
                                </a>
                            ))}

                            {/* Expand Toggle for Social Row */}
                            {appearance.link_style === 'row' && creator.links.length > 4 && (
                                <button
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
                                </button>
                            )}
                            {creator.links.length === 0 && (
                                <div className={`col-span-full text-center text-sm ${textSecondaryColor} py-4 opacity-50`}>
                                    No links available.
                                </div>
                            )}
                        </div>

                        {/* Featured Video */}
                        {creator.featured_video && (
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
                        {creator.verified_videos && creator.verified_videos.length > 0 && (
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
        </div>
    );
};
