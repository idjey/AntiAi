export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SocialIcon } from '@/components/SocialIcon';

interface Props {
    params: {
        handle: string;
    };
}

async function getCreator(handle: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public/creators/${handle}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

export default async function PublicProfilePage({ params }: Props) {
    const creator = await getCreator(params.handle);

    if (!creator) {
        notFound();
    }

    const appearance = creator.appearance || {
        theme: 'modern_dark',
        primary_color: '#10b981',
        background_color: '#050505',
        icon_style: 'monochrome'
    };

    const isLightMode = appearance.background_color === '#ffffff';
    const textColor = isLightMode ? 'text-black' : 'text-white';
    const textSecondaryColor = isLightMode ? 'text-gray-600' : 'text-gray-400';

    return (
        <div
            className={`min-h-screen flex flex-col items-center py-12 px-4 transition-colors duration-500`}
            style={{
                backgroundColor: appearance.background_color,
                color: isLightMode ? '#000000' : '#ffffff'
            }}
        >
            {/* Theme Effects */}
            {appearance.theme === 'holographic' && (
                <div className="fixed inset-0 pointer-events-none opacity-30 bg-gradient-to-tr from-purple-500/20 via-blue-500/20 to-teal-500/20 z-0" />
            )}

            {/* Logo Rendering */}
            {appearance.logo_url && (
                <>
                    {appearance.logo_position === 'scatter' ? (
                        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10 z-0">
                            {[...Array(6)].map((_, i) => (
                                <img
                                    key={i}
                                    src={appearance.logo_url}
                                    className="absolute w-32 h-32 object-contain opacity-50 grayscale"
                                    style={{
                                        top: `${Math.random() * 80}%`,
                                        left: `${Math.random() * 80}%`,
                                        transform: `rotate(${Math.random() * 360}deg)`
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={`fixed inset-0 z-0 pointer-events-none p-6 flex w-full h-full max-w-4xl mx-auto ${appearance.logo_position === 'top_left' ? 'items-start justify-start' :
                                appearance.logo_position === 'top_right' ? 'items-start justify-end' :
                                    appearance.logo_position === 'center_top' ? 'items-start justify-center' :
                                        appearance.logo_position === 'center' ? 'items-center justify-center' :
                                            appearance.logo_position === 'bottom_left' ? 'items-end justify-start' :
                                                appearance.logo_position === 'bottom_right' ? 'items-end justify-end' : ''
                            }`}>
                            <img
                                src={appearance.logo_url}
                                className={`${appearance.logo_position === 'center' ? 'w-full max-w-[400px] opacity-10' : 'w-20 h-20'} object-contain`}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Profile Card */}
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">

                {/* Avatar & Info */}
                <div className="text-center space-y-4">
                    <div className="mx-auto w-24 h-24 rounded-full p-1" style={{ background: `linear-gradient(to bottom right, ${appearance.primary_color}, ${appearance.primary_color}40)` }}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-surface border-4" style={{ borderColor: appearance.background_color }}>
                            {creator.avatar_url ? (
                                <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                            ) : (
                                <div
                                    className={`w-full h-full flex items-center justify-center text-2xl font-bold`}
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

                    <div>
                        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                            {creator.display_name}
                            <svg className="w-5 h-5" style={{ color: appearance.primary_color }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </h1>
                        <p className={textSecondaryColor}>@{creator.handle}</p>
                    </div>

                    {creator.bio && (
                        <p className={`${textSecondaryColor} max-w-xs mx-auto text-sm leading-relaxed whitespace-pre-wrap`}>
                            {creator.bio}
                        </p>
                    )}
                </div>

                {/* Links */}
                <div className="space-y-3">
                    {creator.links.map((link: any) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block w-full border p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] group`}
                            style={{
                                backgroundColor: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                borderColor: `${appearance.primary_color}40`,
                            }}
                        >
                            <div className={`transition-colors`}>
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <SocialIcon
                                        type={link.icon}
                                        url={link.url}
                                        variant={appearance.icon_style}
                                        className={isLightMode && appearance.icon_style === 'monochrome' ? 'text-black' : ''}
                                    />
                                </div>
                            </div>
                            <span className="font-medium text-center flex-1 pr-9">{link.label}</span>
                        </a>
                    ))}
                    {creator.links.length === 0 && (
                        <div className={`text-center text-sm ${textSecondaryColor} py-2`}>
                            No links added yet.
                        </div>
                    )}
                </div>

                {/* Featured Video */}
                {creator.featured_video && (
                    <div className="space-y-4 pt-4">
                        <h2 className={`text-sm font-bold ${textSecondaryColor} uppercase tracking-widest text-center`}>Featured Verification</h2>
                        <div
                            className="bg-surface border rounded-xl overflow-hidden transition-colors"
                            style={{ borderColor: `${appearance.primary_color}40` }}
                        >
                            <div className="aspect-video relative bg-black">
                                <img src={creator.featured_video.thumbnail_url} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: appearance.primary_color }}>
                                        <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1">
                                    <svg className="w-3 h-3" style={{ color: appearance.primary_color }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                    <span className="text-xs font-medium text-white">Verified</span>
                                </div>
                            </div>
                            <div className="p-4" style={{ backgroundColor: isLightMode ? '#f9fafb' : '#101010' }}>
                                <h3 className={`font-bold line-clamp-1 ${textColor}`}>{creator.featured_video.title}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className={`text-xs ${textSecondaryColor}`}>Authenticity Verified</span>
                                    <Link href={`/verify/${creator.featured_video.youtube_video_id}`} className="text-xs hover:underline" style={{ color: appearance.primary_color }}>
                                        View Certificate &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="pt-8 text-center space-y-2">
                    <Link href="/" className={`inline-flex items-center gap-2 ${textSecondaryColor} hover:opacity-100 transition-opacity`}>
                        <span className="text-sm">Verified by</span>
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">AntiAI</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
