'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SocialIcon } from '@/components/SocialIcon';

interface Props {
    creator: any;
}

export const PublicProfile = ({ creator }: Props) => {
    const appearance = creator.appearance || {
        theme: 'modern_dark',
        primary_color: '#10b981',
        background_color: '#050505',
        icon_style: 'monochrome'
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
                        background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${(bgVignette || 0) / 100}) 150%)`
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
            <div className="relative z-10 w-full min-h-screen overflow-y-auto overflow-x-hidden py-12 px-4 flex flex-col items-center justify-center">

                {/* 4. The "Card" (Content Container) */}
                <div
                    className="w-full max-w-md relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700"
                    style={{
                        backgroundColor: appearance.background_color, // Inner Card Color
                        color: isLightMode ? '#000000' : '#ffffff',
                        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)${cardGlow > 0 ? `, 0 0 ${cardGlow * 30}px ${appearance.primary_color}60` : ''}`
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
                    <div className="relative z-10 flex flex-col p-8 pb-12">

                        {/* Avatar & Info */}
                        <div className="text-center space-y-4 mb-8">
                            {/* Avatar */}
                            <div className="mx-auto w-28 h-28 rounded-full p-1" style={{ background: `linear-gradient(to bottom right, ${appearance.primary_color}, ${appearance.primary_color}40)` }}>
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
                        <div className="space-y-3 w-full">
                            {creator.links.map((link: any, i: number) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full border p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] group backdrop-blur-sm relative overflow-hidden"
                                    style={{
                                        backgroundColor: isLightMode ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.05)',
                                        borderColor: `${appearance.primary_color}30`,
                                        animationDelay: `${i * 100}ms`
                                    }}
                                >
                                    {/* Hover Fill Effect */}
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <SocialIcon
                                                type={link.icon}
                                                url={link.url}
                                                variant={appearance.icon_style}
                                                className={isLightMode && appearance.icon_style === 'monochrome' ? 'text-black' : ''}
                                            />
                                        </div>
                                    </div>
                                    <span className="font-medium text-center flex-1 pr-10 relative z-10">{link.label}</span>
                                </a>
                            ))}
                            {creator.links.length === 0 && (
                                <div className={`text-center text-sm ${textSecondaryColor} py-4 opacity-50`}>
                                    No links available.
                                </div>
                            )}
                        </div>

                        {/* Featured Video */}
                        {creator.featured_video && (
                            <div className="space-y-4 pt-8 w-full">
                                <h2 className={`text-xs font-bold ${textSecondaryColor} uppercase tracking-widest text-center opacity-70`}>Featured Verification</h2>
                                <div
                                    className="bg-surface border rounded-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/20 backdrop-blur-sm group"
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

                        {/* Footer */}
                        <div className="pt-8 text-center mt-auto">
                            <Link href="/" className={`inline-flex items-center gap-2 ${textSecondaryColor} hover:opacity-100 transition-opacity opacity-70`}>
                                <span className="text-xs font-medium">Verified by</span>
                                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">AntiAI</span>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
