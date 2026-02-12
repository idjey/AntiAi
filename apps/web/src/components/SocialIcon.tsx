
'use client';

import React from 'react';

export const getIconType = (url: string): string => {
    try {
        const domain = url.toLowerCase();
        if (domain.includes('instagram.com')) return 'instagram';
        if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
        if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'youtube';
        if (domain.includes('facebook.com')) return 'facebook';
        if (domain.includes('linkedin.com')) return 'linkedin';
        if (domain.includes('tiktok.com')) return 'tiktok';
        if (domain.includes('discord.com') || domain.includes('discord.gg')) return 'discord';
        if (domain.includes('github.com')) return 'github';
        if (domain.includes('twitch.tv')) return 'twitch';
        if (domain.includes('t.me') || domain.includes('telegram.org')) return 'telegram';
        if (domain.includes('whatsapp.com')) return 'whatsapp';
        if (domain.includes('spotify.com')) return 'spotify';
        if (domain.includes('patreon.com')) return 'patreon';
    } catch (e) {
        return 'website';
    }
    return 'website';
};

interface SocialIconProps {
    type?: string;
    url?: string;
    className?: string;
    variant?: 'monochrome' | 'color';
}

export const SocialIcon: React.FC<SocialIconProps> = ({ type, url, className = "w-5 h-5", variant = 'monochrome' }) => {
    const iconType = type || (url ? getIconType(url) : 'website');
    const isColor = variant === 'color';

    // Return specific SVGs for known platforms
    switch (iconType) {
        case 'instagram':
            return (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke={isColor ? 'none' : 'currentColor'} xmlns="http://www.w3.org/2000/svg">
                    {isColor ? (
                        <>
                            <defs>
                                <linearGradient id="ig-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#405DE6" />
                                    <stop offset="0.5" stopColor="#C13584" />
                                    <stop offset="1" stopColor="#FD1D1D" />
                                </linearGradient>
                            </defs>
                            <path fill="url(#ig-grad)" d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.637.247-1.363.416-2.428.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.451 2.525c.636-.247 1.363-.416 2.427-.465C8.944 2.013 9.283 2 12 2z" />
                            <path fill="url(#ig-grad)" d="M12 7a5 5 0 100 10 5 5 0 000-10zM17.5 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                        </>
                    ) : (
                        <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.637.247-1.363.416-2.428.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.451 2.525c.636-.247 1.363-.416 2.427-.465C8.944 2.013 9.283 2 12 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7a5 5 0 100 10 5 5 0 000-10z" />
                            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                        </>
                    )}
                </svg>
            );
        case 'twitter':
        case 'x':
            return (
                <svg className={className} fill={isColor ? "#000000" : "none"} viewBox="0 0 24 24" stroke={isColor ? "none" : "currentColor"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
            );
        case 'youtube':
            return (
                <svg className={className} fill={isColor ? "#FF0000" : "none"} viewBox="0 0 24 24" stroke={isColor ? "none" : "currentColor"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
                    <path fill={isColor ? "white" : "none"} strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" />
                </svg>
            );
        case 'facebook':
            return (
                <svg className={className} fill={isColor ? "#1877F2" : "none"} viewBox="0 0 24 24" stroke={isColor ? "none" : "currentColor"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
            );
        case 'linkedin':
            return (
                <svg className={className} fill={isColor ? "#0A66C2" : "none"} viewBox="0 0 24 24" stroke={isColor ? "none" : "currentColor"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M2 9h4v12H2z" />
                    <circle cx="4" cy="4" r={isColor ? 2 : 2} fill={isColor ? "#0A66C2" : "none"} strokeWidth={isColor ? 0 : 2} />
                </svg>
            );
        case 'github':
            return (
                <svg className={className} fill={isColor ? "#181717" : "none"} viewBox="0 0 24 24" stroke={isColor ? "none" : "currentColor"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 11.61 6.44 11.85A3.37 3.37 0 009 18.13V22" />
                </svg>
            );
        case 'tiktok':
            return (
                <svg className={className} fill={isColor ? "#000000" : "none"} viewBox="0 0 24 24" stroke={isColor ? "none" : "currentColor"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
                </svg>
            );
        case 'twitch':
            return (
                <svg className={className} fill={isColor ? "#9146FF" : "none"} viewBox="0 0 24 24" stroke={isColor ? "none" : "currentColor"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isColor ? 0 : 2} d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" />
                </svg>
            );
        case 'website':
        default:
            if (url) {
                try {
                    const domain = new URL(url).hostname;
                    return (
                        <div className={`${className} relative`}>
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                                alt={`${domain} icon`}
                                className={`${className} rounded`}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                }}
                            />
                            <div className="fallback-icon hidden absolute inset-0">
                                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-9 3-9s-3-9-3-9m0 18c-1.657 0-3-9-3-9s3-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </div>
                        </div>
                    );
                } catch (e) {
                    // Invalid URL
                }
            }
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-9 3-9s-3-9-3-9m0 18c-1.657 0-3-9-3-9s3-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
            );
    }
};
